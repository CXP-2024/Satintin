package Impl

import Utils.FriendManagementProcess.addFriendEntry
import Common.API.{API, PlanContext, Planner}
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

case class AcceptFriendRequestMessage(userToken: String, friendID: String) extends API[String]("AcceptFriendRequest")

case class AcceptFriendRequestMessagePlanner(userToken: String, friendID: String, override val planContext: PlanContext)
  extends Planner[String] {

  
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: 验证 userToken 是否有效并获取 userID
      _ <- IO(logger.info(s"验证 userToken=${userToken}"))
      userID <- getUserIDByToken(userToken)
      _ <- IO(logger.info(s"userID=${userID} 已获取"))

      // Step 2: 检查好友请求记录是否存在
      _ <- IO(logger.info(s"检查好友请求 userID=${userID} friendID=${friendID} 是否存在"))
      requestExists <- checkFriendRequestExists(userID, friendID)
      _ <- if (!requestExists) 
             IO.raiseError(new IllegalStateException("好友请求不存在")) 
           else IO(logger.info("好友请求存在，继续处理"))

      // Step 3: 添加好友到好友列表
      _ <- IO(logger.info(s"将 friendID=${friendID} 添加到 userID=${userID} 的好友列表"))
      addResult <- addFriendEntry(userID, friendID)
      _ <- IO(logger.info(s"好友已成功添加，结果：${addResult}"))

    } yield "好友请求已接受！"
  }

  // 子函数：根据 userToken 获取 userID
  private def getUserIDByToken(userToken: String)(using PlanContext): IO[String] = {
    val sql = s"SELECT user_id FROM ${schemaName}.user_tokens WHERE token = ?"
    val parameters = List(SqlParameter("String", userToken))
    readDBString(sql, parameters)
  }

  // 子函数：检查好友请求是否存在
  private def checkFriendRequestExists(userID: String, friendID: String)(using PlanContext): IO[Boolean] = {
    val sql =
      s"""
         |SELECT EXISTS (
         |  SELECT 1
         |  FROM ${schemaName}.user_social_table
         |  WHERE user_id = ?
         |    AND ? = ANY(message_box::TEXT[])
         |)
       """.stripMargin
    val parameters = List(
      SqlParameter("String", userID),
      SqlParameter("String", friendID)
    )
    readDBBoolean(sql, parameters)
  }
}