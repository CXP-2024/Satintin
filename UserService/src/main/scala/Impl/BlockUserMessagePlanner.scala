package Impl

import Objects.UserService.{MessageEntry, User, BlackEntry, FriendEntry}
import Utils.FriendManagementProcess.addToBlacklist
import Utils.UserAuthenticationProcess.authenticateUser
import Utils.UserTokenValidator.getUserIDFromToken
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import cats.effect.IO
import cats.implicits.*
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime

case class BlockUserMessagePlanner(
                                    userToken: String,
                                    blackUserID: String,
                                    override val planContext: PlanContext
                                  ) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1. 验证userToken并获取真实的userID
      _ <- IO(logger.info(s"开始验证userToken并获取userID"))
      userID <- getUserIDFromToken(userToken)
      _ <- IO(logger.info(s"userToken验证成功，用户ID=${userID}"))

      // Step 2. Ensure user exists in social table
      _ <- IO(logger.info(s"检查并确保用户${userID}在user_social_table中存在"))
      _ <- ensureUserExistsInSocialTable(userID)

      // Step 3. Add blackUserID to blacklist using the existing utility function
      _ <- IO(logger.info(s"将用户[${blackUserID}]加入用户[${userID}]的黑名单中"))
      resultMessage <- addToBlacklist(userID, blackUserID)

      // Step 4. Return the result
      _ <- IO(logger.info(s"操作完成，返回结果：${resultMessage}"))
    } yield resultMessage
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