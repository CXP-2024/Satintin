package Impl


import Utils.FriendManagementProcess.addFriendEntry
import Utils.UserAuthenticationProcess.authenticateUser
import Utils.UserTokenValidator.getUserIDFromToken
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
import Objects.UserService.{MessageEntry, BlackEntry, FriendEntry}

case class AddFriendMessagePlanner(
  userToken: String,
  friendID: String,
  override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate userToken and get the actual userID
      _ <- IO(logger.info(s"开始验证userToken并获取userID"))
      userID <- getUserIDFromToken(userToken)
      _ <- IO(logger.info(s"userToken验证成功，获取到userID=${userID}"))

      // Step 2: Add friendID to the user's friend list
      _ <- IO(logger.info(s"开始调用addFriendEntry，向用户${userID}的好友列表添加${friendID}"))
      operationResult <- addFriendToUserList(userID, friendID)

      // Step 3: Return operation result message
      _ <- IO(logger.info(s"好友添加成功，返回结果"))
    } yield operationResult
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