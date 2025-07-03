package Impl

import Utils.UserAuthenticationProcess.clearOnlineStatus
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
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class LogoutUserMessagePlanner(
    userToken: String,
    override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    // 主流程
    for {
      // Step 1: 验证userToken（实际上就是userID）
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 开始验证userID，userToken=${userToken}"))
      validatedUserID <- validateUserID(userToken)

      // Step 2: 调用clearOnlineStatus方法，将用户的在线状态设为离线
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 设置用户离线状态开始，userID=${validatedUserID}"))
      _ <- clearOnlineStatus(validatedUserID)

      // Step 3: 返回操作结果提示
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 用户已成功登出，userID=${validatedUserID}"))
    } yield "登出成功!"
  }

  /**
   * 验证userToken（就是userID）的有效性
   */
  private def validateUserID(userID: String)(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner.validateUserID] 验证userID: ${userID}"))
      
      // 只查询user_id字段来验证存在性
      userResult <- readDBRows(
        s"SELECT user_id FROM ${schemaName}.user_table WHERE user_id = ?;",
        List(SqlParameter("String", userID))
      )
      _ <- IO(logger.info(s"userID验证查询结果数量: ${userResult.length}"))
      
      validatedUserID <- if (userResult.nonEmpty) {
        IO(logger.info(s"userID验证成功: ${userID}")) >> IO.pure(userID)
      } else {
        val errorMessage = s"无效的userID: ${userID}"
        IO(logger.error(errorMessage)) >>
          IO.raiseError(new IllegalArgumentException(errorMessage))
      }
    } yield validatedUserID
  }
}