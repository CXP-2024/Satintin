package Impl


import Utils.ReportManagementProcess.unbanUser
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
import Common.DBAPI._
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.ServiceUtils.schemaName
import Utils.ReportManagementProcess.unbanUser
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class UnbanUserMessagePlanner(
                                    adminToken: String,
                                    userID: String,
                                    override val planContext: PlanContext
                                  ) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: Validate the admin token
      isValidAdminToken <- validateAdminToken(adminToken)
      _ <- IO {
        if (!isValidAdminToken) {
          logger.error(s"[UnbanUserMessage] 无效的管理员Token: ${adminToken}")
          throw new IllegalAccessException("管理员Token不合法，操作终止")
        } else {
          logger.info(s"[UnbanUserMessage] 管理员身份验证成功, Token: ${adminToken}")
        }
      }

      // Step 2: Unban the user
      _ <- IO(logger.info(s"[UnbanUserMessage] 开始调用unbanUser方法解封用户, UserID: ${userID}"))
      unbanResult <- unbanUser(userID)
      _ <- IO(logger.info(s"[UnbanUserMessage] 用户解封成功，UserID: ${userID}, 接口返回: ${unbanResult}"))

      // Step 3: Return success message
      successMessage <- IO {
        val message = "用户解封成功！"
        logger.info(s"[UnbanUserMessage] 返回结果: ${message}")
        message
      }
    } yield successMessage
  }

  private def validateAdminToken(token: String)(using PlanContext): IO[Boolean] = {
    val validationSql =
      s"""
        SELECT COUNT(*) > 0
        FROM ${schemaName}.admin_table
        WHERE admin_token = ?
      """
    val parameters = List(SqlParameter("String", token))
    for {
      _ <- IO(logger.info(s"[UnbanUserMessage] 验证管理员Token的SQL: ${validationSql}"))
      result <- readDBBoolean(validationSql, parameters)
      _ <- IO(logger.info(s"[UnbanUserMessage] 管理员Token验证结果: ${result}"))
    } yield result
  }
}