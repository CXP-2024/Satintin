package Impl

import Utils.ReportManagementProcess.unbanUser
import Utils.AdminTokenValidationProcess
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

case class UnbanUserMessagePlanner(
                                    adminToken: String,
                                    userID: String,
                                    override val planContext: PlanContext
                                  ) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"[UnbanUserMessage] 开始执行解封操作"))

      // Step 1: 验证管理员Token - 使用Utils
      _ <- AdminTokenValidationProcess.validateAdminToken(adminToken)

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
}