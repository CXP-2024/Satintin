package Impl


import Utils.FriendManagementProcess.addFriendEntry
import Utils.UserAuthenticationProcess.authenticateUser
import Objects.UserService.User
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
import Objects.UserService.MessageEntry
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
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
import Objects.UserService.FriendEntry
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class AddFriendMessagePlanner(
  userToken: String,
  friendID: String,
  override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Verify userToken and get userID
      _ <- IO(logger.info(s"验证userToken有效性并获取userID，userToken=${userToken}"))
      userID <- verifyUserToken(userToken)

      // Step 2: Add friendID to the user's friend list
      _ <- IO(logger.info(s"开始调用addFriendEntry，向用户${userID}的好友列表添加${friendID}"))
      operationResult <- addFriendToUserList(userID, friendID)

      // Step 3: Return operation result message
      _ <- IO(logger.info(s"好友添加成功，返回结果"))
    } yield operationResult
  }

  // Helper function: Verify userToken and get userID
  private def verifyUserToken(userToken: String)(using PlanContext): IO[String] = {
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
      
      user <- finalResult.headOption match {
        case Some(userJson) =>
          // Parse the user data
          for {
            user <- IO.fromEither(userJson.as[User])
            _ <- IO(logger.info(s"用户验证成功，用户ID: ${user.userID}, 用户名: ${user.userName}"))
          } yield user
        case None =>
          val errorMessage = s"无效的userToken，既不是有效的用户ID也不是有效的用户名: ${userToken}"
          IO(logger.error(errorMessage)) >>
            IO.raiseError(new IllegalArgumentException(errorMessage))
      }
    } yield user.userID
  }

  // Helper function: Add friendID to user's friend list
  private def addFriendToUserList(userID: String, friendID: String)(using PlanContext): IO[String] = {
    for {
      // Step 1: Check if user exists in user_social_table, create if missing
      _ <- IO(logger.info(s"检查并确保用户${userID}在user_social_table中存在"))
      _ <- ensureUserExistsInSocialTable(userID)
      
      // Step 1.1: Check if friend also exists in user_social_table, create if missing
      _ <- IO(logger.info(s"检查并确保好友${friendID}在user_social_table中存在"))
      _ <- ensureUserExistsInSocialTable(friendID)
      
      // Step 2: Call addFriendEntry.
      _ <- IO(logger.info(s"调用addFriendEntry函数向用户${userID}的好友列表添加好友${friendID}"))
      operationResult <- addFriendEntry(userID, friendID)

      // Step 3: Log the result and return operationResult
      _ <- IO(logger.info(s"addFriendEntry执行结果: ${operationResult}"))
    } yield operationResult
  }

  // Helper function: Ensure user exists in user_social_table
  private def ensureUserExistsInSocialTable(userID: String)(using PlanContext): IO[Unit] = {
    for {
      // Check if user exists in social table
      socialResult <- readDBRows(
        s"SELECT * FROM ${schemaName}.user_social_table WHERE user_id = ?;",
        List(SqlParameter("String", userID))
      )
      _ <- if (socialResult.isEmpty) {
        // User doesn't exist in social table, create entry with proper JSON format
        for {
          _ <- IO(logger.info(s"用户${userID}在user_social_table中不存在，正在创建默认条目"))
          _ <- writeDB(
            s"""INSERT INTO ${schemaName}.user_social_table 
                (user_id, friend_list, black_list, message_box) 
                VALUES (?, ?::jsonb, ?::jsonb, ?::jsonb)""",
            List(
              SqlParameter("String", userID),
              SqlParameter("String", "[]"),
              SqlParameter("String", "[]"),
              SqlParameter("String", "[]")
            )
          )
          _ <- IO(logger.info(s"已为用户${userID}创建user_social_table条目"))
        } yield ()
      } else {
        IO(logger.info(s"用户${userID}在user_social_table中已存在"))
      }
    } yield ()
  }
}