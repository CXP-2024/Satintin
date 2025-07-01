package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import APIs.UserService.{UserBasicInfo, ViewUserBasicInfoMessage}
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits._

case class ViewUserBasicInfoMessagePlanner(
    userID: String,
    override val planContext: PlanContext
) extends Planner[List[UserBasicInfo]] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[List[UserBasicInfo]] = {
    for {
      _ <- IO(logger.info(s"查询用户基本信息，userID=${userID}"))
      
      // 根据是否提供userID来决定查询单个用户还是所有用户
      userInfoList <- if (userID.nonEmpty) {
        getSingleUserBasicInfo(userID)
      } else {
        getAllUsersBasicInfo()
      }
      
      _ <- IO(logger.info(s"成功查询到 ${userInfoList.length} 个用户的基本信息"))
    } yield userInfoList
  }

  /**
   * 查询单个用户的基本信息
   */
  private def getSingleUserBasicInfo(userID: String)(using PlanContext): IO[List[UserBasicInfo]] = {
    val sql =
      s"""
SELECT user_id, username, ban_days, is_online
FROM ${schemaName}.user_table
WHERE user_id = ?
       """.stripMargin

    for {
      _ <- IO(logger.info(s"执行查询单个用户基本信息的SQL: userID=${userID}"))
      rows <- readDBRows(sql, List(SqlParameter("String", userID)))
      userInfo <- IO {
        rows.map { json =>
          val cursor = json.hcursor
          UserBasicInfo(
            userID = cursor.downField("user_id").as[String].getOrElse(""),
            username = cursor.downField("username").as[String].getOrElse(""),
            banDays = cursor.downField("ban_days").as[Int].getOrElse(0),
            isOnline = cursor.downField("is_online").as[Boolean].getOrElse(false)
          )
        }
      }
      _ <- IO(logger.info(s"成功解析用户基本信息: ${userInfo.headOption.map(_.username).getOrElse("未找到用户")}"))
    } yield userInfo
  }

  /**
   * 查询所有用户的基本信息
   */
  private def getAllUsersBasicInfo()(using PlanContext): IO[List[UserBasicInfo]] = {
    val sql =
      s"""
SELECT user_id, username, ban_days, is_online
FROM ${schemaName}.user_table
ORDER BY register_time DESC
       """.stripMargin

    for {
      _ <- IO(logger.info("执行查询所有用户基本信息的SQL"))
      rows <- readDBRows(sql, List())
      userInfoList <- IO {
        rows.map { json =>
          val cursor = json.hcursor
          UserBasicInfo(
            userID = cursor.downField("user_id").as[String].getOrElse(""),
            username = cursor.downField("username").as[String].getOrElse(""),
            banDays = cursor.downField("ban_days").as[Int].getOrElse(0),
            isOnline = cursor.downField("is_online").as[Boolean].getOrElse(false)
          )
        }
      }
      _ <- IO(logger.info(s"成功解析 ${userInfoList.length} 个用户的基本信息"))
    } yield userInfoList
  }
}