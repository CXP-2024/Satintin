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
import Utils.UserAuthenticationProcess.clearOnlineStatus
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class LogoutUserMessagePlanner(
    userToken: String,
    override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    // 主流程
    for {
      // Step 1: 根据userToken解析并获取userID
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 开始获取用户ID，userToken=${userToken}"))
      userID <- getUserIDFromToken(userToken)

      // Step 2: 调用clearOnlineStatus方法，将用户的在线状态设为离线
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 设置用户离线状态开始，userID=${userID}"))
      _ <- clearOnlineStatus(userID)

      // Step 3: 返回操作结果提示
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 用户已成功登出，userID=${userID}"))
    } yield "登出成功!"
  }

  // 获取 userID 的方法
  private def getUserIDFromToken(token: String)(using PlanContext): IO[String] = {
    val sqlQuery =
      s"""
         SELECT user_id
         FROM ${schemaName}.user_table
         WHERE token = ?
       """
    for {
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner.getUserIDFromToken] 执行SQL查询以根据token获取userID"))
      resultJson <- readDBJson(
        sqlQuery,
        List(SqlParameter("String", token))
      )
      userID <- IO(
        decodeField[String](resultJson, "user_id")
      )
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner.getUserIDFromToken] 成功获取到的userID=${userID}"))
    } yield userID
  }
}