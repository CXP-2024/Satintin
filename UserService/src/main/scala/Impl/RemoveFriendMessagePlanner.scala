package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.FriendManagementProcess.removeFriendEntry
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.UserService.User

case class RemoveFriendMessagePlanner(
    userToken: String,
    friendID: String,
    override val planContext: PlanContext
) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: 验证 userToken 是否有效
      _ <- IO(logger.info(s"验证 userToken '${userToken}' 是否有效"))
      userID <- validateUserToken()

      // Step 2: 调用 removeFriendEntry 方法移除好友
      _ <- IO(logger.info(s"调用 removeFriendEntry 移除好友 friendID '${friendID}'"))
      operationResult <- removeFriendEntry(userID, friendID)

      // Step 3: 根据操作结果生成响应
      response <- operationResult match {
        case Some(successMessage) =>
          IO(logger.info(s"移除好友成功: ${successMessage}")) *> IO("好友已移除！")
        case None =>
          IO(logger.error(s"移除好友失败，找不到对应的记录")) *> IO.raiseError(new RuntimeException("好友移除失败"))
      }
    } yield response
  }

  // 验证 userToken 是否有效，并解析出 userID
  private def validateUserToken()(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"开始验证userToken: ${userToken}"))
      // First try to treat it as a user_id (UUID)
      userIdResult <- readDBRows(
        s"SELECT * FROM ${schemaName}.user_table WHERE user_id = ?;",
        List(SqlParameter("String", userToken))
      )
      _ <- IO(logger.info(s"按user_id查询结果数量: ${userIdResult.length}"))
      
      // If not found, try to treat it as a username
      userNameResult <- if (userIdResult.isEmpty) {
        for {
          _ <- IO(logger.info(s"user_id未找到，尝试按username查询: ${userToken}"))
          result <- readDBRows(
            s"SELECT * FROM ${schemaName}.user_table WHERE username = ?;",
            List(SqlParameter("String", userToken))
          )
          _ <- IO(logger.info(s"按username查询结果数量: ${result.length}"))
        } yield result
      } else IO(List.empty)
      
      // Use whichever query returned results
      finalResult = if (userIdResult.nonEmpty) userIdResult else userNameResult
      _ <- if (finalResult.nonEmpty) IO(logger.info(s"找到用户数据: ${finalResult.head}")) else IO(logger.info("未找到用户数据"))
      
      userID <- finalResult.headOption match {
        case Some(userJson) =>
          // Parse the user data and extract userID
          for {
            user <- IO.fromEither(userJson.as[User])
            _ <- IO(logger.info(s"用户验证成功，用户ID: ${user.userID}, 用户名: ${user.userName}"))
          } yield user.userID
        case None =>
          val errorMessage = s"无效的userToken，既不是有效的用户ID也不是有效的用户名: ${userToken}"
          IO(logger.error(errorMessage)) >>
            IO.raiseError(new IllegalArgumentException(errorMessage))
      }
    } yield userID
  }
}