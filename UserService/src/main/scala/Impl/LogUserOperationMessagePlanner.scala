package Impl

import Objects.UserService.MessageEntry
import Objects.UserService.User
import Utils.UserAuthenticationProcess.authenticateUser
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.ParameterList
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import org.joda.time.DateTime
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import APIs.UserService.GetUserInfoMessage

case class LogUserOperationMessagePlanner(
    userToken: String,
    actionType: String,
    actionDetail: String,
    override val planContext: PlanContext
) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: 验证userToken是否有效并获取userID
      _ <- IO(logger.info(s"开始验证用户Token: ${userToken}"))
      userID <- validateAndExtractUserID(userToken)

      // Step 2: 在UserOperationLogTable中插入一条新记录
      _ <- IO(logger.info(s"插入用户操作行为日志，userID: ${userID}, actionType: ${actionType}, actionDetail: ${actionDetail}"))
      _ <- logUserOperation(userID, actionType, actionDetail)

      // Step 3: 返回成功提示
      _ <- IO(logger.info(s"用户操作行为记录成功，userID: ${userID}"))
    } yield "操作记录成功！"
  }

  /**
   * 验证userToken是否合法并提取userID
   */
  private def validateAndExtractUserID(userToken: String)(using PlanContext): IO[String] = {
    // Use the same approach as other services - use userToken as userID and call GetUserInfoMessage
    val userID = userToken
    for {
      _ <- IO(logger.info(s"通过 UserService 验证用户令牌: ${userToken}"))
      user <- GetUserInfoMessage(userToken, userID).send.handleErrorWith { error =>
        IO(logger.error(s"用户令牌验证失败: ${error.getMessage}"))
          >> IO.raiseError(new RuntimeException("用户身份令牌无效"))
      }
      _ <- IO(logger.info(s"用户令牌有效，用户ID为: ${user.userID}"))
    } yield user.userID
  }

  /**
   * 将操作日志写入用户操作日志表
   */
  private def logUserOperation(userID: String, actionType: String, actionDetail: String)(using PlanContext): IO[Unit] = {
    val logId = java.util.UUID.randomUUID().toString // 生成唯一log_id
    val timestamp = DateTime.now() // 当前时间戳

    val insertSql =
      s"""
INSERT INTO ${schemaName}.user_operation_log_table (log_id, user_id, action_type, action_detail, action_time)
VALUES (?, ?, ?, ?, ?)
""".stripMargin

    val params = List(
      SqlParameter("String", logId),
      SqlParameter("String", userID),
      SqlParameter("String", actionType),
      SqlParameter("String", actionDetail),
      SqlParameter("DateTime", timestamp.getMillis.toString)
    )

    writeDB(insertSql, params).flatMap { result =>
      IO(logger.info(s"成功写入行为日志表: logId=${logId}, SQL结果: ${result}"))
    }
  }
}