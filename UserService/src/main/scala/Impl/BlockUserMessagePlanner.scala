package Impl

import Objects.UserService.{MessageEntry, User, BlackEntry, FriendEntry}
import Utils.FriendManagementProcess.addToBlacklist
import Utils.UserAuthenticationProcess.authenticateUser
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
      // Step 1. Validate userToken and extract userID
      _ <- IO(logger.info(s"开始验证用户身份，userToken=${userToken}"))
      userID <- validateUserToken(userToken)

      // Step 2. Add blackUserID to blacklist
      _ <- IO(logger.info(s"将用户[${blackUserID}]加入用户[${userID}]的黑名单中"))
      _ <- performAddToBlacklist(userID, blackUserID)

      // Step 3. Return the result
      resultMessage <- IO("用户已加入黑名单！")
      _ <- IO(logger.info(s"操作完成，返回结果：${resultMessage}"))
    } yield resultMessage
  }

  private def validateUserToken(userToken: String)(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"调用authenticateUser方法验证用户Token"))
      authenticationResult <- authenticateUser(userToken, "")
      user <- authenticationResult match {
        case Some(user) => IO.pure(user)
        case None =>
          IO.raiseError(new IllegalArgumentException("用户身份验证失败！"))
      }
    } yield user.userID
  }

  
  private def performAddToBlacklist(userID: String, blackUserID: String)(using PlanContext): IO[Unit] = {
    for {
      // Step 1: Retrieve user's blacklist from the database
      _ <- IO(logger.info(s"查询用户[userID=${userID}]的黑名单信息"))
      sqlQuery <- IO(s"SELECT black_list FROM ${schemaName}.user_social_table WHERE user_id = ?")
      params <- IO(List(SqlParameter("String", userID)))
      blackListJsonOpt <- readDBJsonOptional(sqlQuery, params)

      // Step 2: Decode the blacklist and validate input
      currentBlacklist <- IO {
        blackListJsonOpt match {
          case Some(blacklistJson) =>
            decodeField[List[String]](blacklistJson, "black_list")
          case None =>
            throw new IllegalStateException(s"未找到用户[userID=${userID}]的黑名单记录")
        }
      }
      _ <- IO(logger.info(s"用户当前的黑名单列表: ${currentBlacklist.mkString("[",", ", "]")}"))
      _ <- if (currentBlacklist.contains(blackUserID)) {
        IO.raiseError(new IllegalArgumentException(s"用户[blackUserID=${blackUserID}]已在黑名单中"))
      } else IO.unit

      // Step 3: Add the blackUserID to the blacklist and update the database
      updatedBlacklist <- IO(blackUserID :: currentBlacklist)
      _ <- IO(logger.info(s"更新后的黑名单: ${updatedBlacklist.mkString("[", ", ", "]")}"))
      updateSql <- IO(s"UPDATE ${schemaName}.user_social_table SET black_list = ? WHERE user_id = ?")
      updateParams <- IO(
        List(
          SqlParameter("Array[String]", updatedBlacklist.asJson.noSpaces),
          SqlParameter("String", userID)
        )
      )
      _ <- writeDB(updateSql, updateParams)
    } yield ()
  }
}