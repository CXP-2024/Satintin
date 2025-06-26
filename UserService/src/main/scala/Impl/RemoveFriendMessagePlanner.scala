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
import Utils.FriendManagementProcess.removeFriendEntry
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

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
      _ <- IO(logger.info(s"从 userToken 解析 userID"))
      querySql <- IO(s"SELECT user_id FROM ${schemaName}.user_token_table WHERE token = ?")
      queryParams <- IO(List(SqlParameter("String", userToken)))
      userJson <- readDBJsonOptional(querySql, queryParams)
      userID <- userJson match {
        case Some(json) =>
          IO(decodeField[String](json, "user_id"))
        case None =>
          IO(logger.error(s"userToken '${userToken}' 无效")) *> IO.raiseError(new IllegalArgumentException("无效的 userToken"))
      }
      _ <- IO(logger.info(s"解析出的 userID: '${userID}'"))
    } yield userID
  }
}