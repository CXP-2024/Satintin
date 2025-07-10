package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe.Json
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class GetUserStatusMessagePlanner(
                                        userToken: String,
                                        userID: String,
                                        override val planContext: PlanContext
                                      ) extends Planner[(Boolean, Option[String])] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[(Boolean, Option[String])] = {
    for {
      // Step 1: Verify userToken
      _ <- IO(logger.info(s"验证用户令牌: ${userToken}"))
      _ <- verifyUserToken()

      // Step 2: Fetch user status (is_online, match_status) from UserTable
      _ <- IO(logger.info(s"从UserTable获取用户[${userID}]的在线状态和对战状态"))
      (onlineStatus, matchStatus) <- getUserOnlineAndMatchStatus()
    } yield (onlineStatus, matchStatus)
  }

  private def verifyUserToken()(using PlanContext): IO[Unit] = {
    // 模拟令牌验证逻辑，可以替换为实际逻辑
    logger.info(s"模拟令牌验证, 令牌为[userToken=${userToken}]")
    if (userToken.isEmpty) {
      IO.raiseError(new IllegalArgumentException("User token is invalid or empty"))
    } else {
      IO.unit
    }
  }

  private def getUserOnlineAndMatchStatus()(using PlanContext): IO[(Boolean, Option[String])] = {
    logger.info(s"开始创建查询用户在线状态和对战状态的数据库SQL")
    val sql =
      s"""
         SELECT is_online, match_status
         FROM ${schemaName}.user_table
         WHERE user_id = ?;
       """
    logger.info(s"SQL查询：${sql}")

    readDBJson(sql, List(SqlParameter("String", userID))).map { json =>
      // 解析 is_online 和 match_status 字段
      val isOnline = decodeField[Boolean](json, "is_online")
      // 注意 match_status 是可空字段，因此使用 Option
      val matchStatus = decodeField[Option[String]](json, "match_status")
      logger.info(s"用户${userID}的在线状态为: ${isOnline}, 对战状态为: ${matchStatus.getOrElse("未设置")}")
      (isOnline, matchStatus)
    }
  }
}