package Impl.Battle

import APIs.UserService.SetUserMatchStatusMessage
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class SetUserMatchStatusMessagePlanner(
  userToken: String,
  matchStatus: String,
  override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: 验证用户令牌
      _ <- IO(logger.info(s"[Step 1] 开始验证用户令牌: ${userToken}"))
      userID <- validateUserToken()
      _ <- IO(logger.info(s"[Step 1] 用户令牌验证通过，用户ID: ${userID}"))

      // Step 2: 验证匹配状态值是否有效
      _ <- IO(logger.info(s"[Step 2] 验证匹配状态值: ${matchStatus}"))
      _ <- validateMatchStatus()
      _ <- IO(logger.info(s"[Step 2] 匹配状态值验证通过"))

      // Step 3: 更新用户的匹配状态
      _ <- IO(logger.info(s"[Step 3] 开始更新用户匹配状态"))
      _ <- updateUserMatchStatus(userID, matchStatus)
      _ <- IO(logger.info(s"[Step 3] 用户匹配状态更新成功"))

    } yield s"${matchStatus}"
  }

  private def validateUserToken()(using PlanContext): IO[String] = {
    val sql = s"""
      SELECT user_id
      FROM ${schemaName}.user_table
      WHERE usertoken = ? AND is_online = true;
    """

    readDBJsonOptional(sql, List(SqlParameter("String", userToken))).flatMap {
      case Some(json) =>
        // 解析用户ID
        val userID = decodeField[String](json, "user_id")
        IO.pure(userID)
      case None =>
        IO.raiseError(new IllegalArgumentException("无效的用户令牌或用户未登录"))
    }
  }

  private def validateMatchStatus()(using PlanContext): IO[Unit] = {
    // 验证匹配状态值是否合法
    // 可以根据实际需求定义合法的匹配状态值列表
    val validMatchStatuses = Set("quick", "ranked", "custom", "Idle")
    
    if (!validMatchStatuses.contains(matchStatus)) {
      IO.raiseError(new IllegalArgumentException(s"无效的匹配状态值: ${matchStatus}，有效值为: ${validMatchStatuses.mkString(", ")}"))
    } else {
      IO.unit
    }
  }

  private def updateUserMatchStatus(userID: String, matchStatus: String)(using PlanContext): IO[Unit] = {
    val sql = s"""
      UPDATE ${schemaName}.user_table
      SET match_status = ?
      WHERE user_id = ?;
    """

    writeDB(sql, List(
      SqlParameter("String", matchStatus),
      SqlParameter("String", userID)
    )).map(_ => ())
  }
}
