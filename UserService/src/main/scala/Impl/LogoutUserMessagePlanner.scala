package Impl

import Utils.UserAuthenticationProcess.clearOnlineStatus
import Utils.UserTokenValidator
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

case class LogoutUserMessagePlanner(
    userToken: String,
    override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: 使用UserTokenValidator验证usertoken并获取userID
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 开始验证usertoken，userToken=${userToken}"))
      userID <- UserTokenValidator.getUserIDFromToken(userToken)

      // Step 2: 调用clearOnlineStatus方法，将用户的在线状态设为离线
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 设置用户离线状态开始，userID=${userID}"))
      _ <- clearOnlineStatus(userID)
      
      // Step 3: 清除该用户创建的所有匹配房间
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 清除用户创建的匹配房间开始，userID=${userID}"))
      roomsDeleted <- clearUserMatchRooms(userID)
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 清除用户匹配房间完成，共删除 ${roomsDeleted} 个房间"))
      
      // Step 4: 清除数据库中的usertoken（可选）
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 清除用户token"))
      _ <- clearUserToken(userID)

      // Step 5: 返回操作结果提示
      _ <- IO(logger.info(s"[LogoutUserMessagePlanner] 用户已成功登出，userID=${userID}"))
    } yield "登出成功!"
  }

  /**
   * 清除用户的token（登出时可以清除token）
   */
  private def clearUserToken(userID: String)(using PlanContext): IO[Unit] = {
    for {
      _ <- writeDB(
        s"UPDATE ${schemaName}.user_table SET usertoken = NULL WHERE user_id = ?;",
        List(SqlParameter("String", userID))
      )
      _ <- IO(logger.info(s"用户token已清除: userID=${userID}"))
    } yield ()
  }

  /**
   * 清除用户创建的所有匹配房间
   * @param userID 用户ID
   * @return IO[Int] 返回删除的房间数量
   */
  private def clearUserMatchRooms(userID: String)(using PlanContext): IO[Int] = {
    for {
      // 先查询该用户创建的房间数量
      countResult <- readDBJsonOptional(
        s"""SELECT COUNT(*) as "count" FROM ${schemaName}.match_room_table WHERE owner_id = ?;""",
        List(SqlParameter("String", userID))
      )
      
      count = countResult.flatMap(_.hcursor.downField("count").as[Int].toOption).getOrElse(0)
      _ <- IO(logger.info(s"查询到用户创建的房间数量: ${count}, userID=${userID}"))
      
      // 删除该用户创建的所有房间
      _ <- if (count > 0) {
        writeDB(
          s"DELETE FROM ${schemaName}.match_room_table WHERE owner_id = ?;",
          List(SqlParameter("String", userID))
        )
      } else {
        IO.unit
      }
      
      _ <- IO(logger.info(s"用户创建的匹配房间已清除: userID=${userID}, 删除房间数=${count}"))
    } yield count
  }
}