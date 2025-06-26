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
      _ <- IO(logger.info(s"开始解析userToken: ${userToken}"))
      userOpt <- authenticateUser(userToken, "") // Assuming the password parameter is empty for token-based verification.
      user <- userOpt match {
        case Some(u) =>
          IO {
            logger.info(s"身份验证成功，获取到用户ID: ${u.userID}")
            u
          }
        case None =>
          val errorMessage = "无效的userToken，身份验证失败！"
          IO(logger.error(errorMessage)) >>
            IO.raiseError(new IllegalArgumentException(errorMessage))
      }
    } yield user.userID
  }

  // Helper function: Add friendID to user's friend list
  private def addFriendToUserList(userID: String, friendID: String)(using PlanContext): IO[String] = {
    for {
      // Step 1: Call addFriendEntry.
      _ <- IO(logger.info(s"调用addFriendEntry函数向用户${userID}的好友列表添加好友${friendID}"))
      operationResult <- addFriendEntry(userID, friendID)

      // Step 2: Log the result and return operationResult
      _ <- IO(logger.info(s"addFriendEntry执行结果: ${operationResult}"))
    } yield operationResult
  }
}