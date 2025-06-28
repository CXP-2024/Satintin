package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.generic.auto._
import io.circe.syntax._
import org.joda.time.DateTime
import cats.implicits.*
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

import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class GetUserIDByTokenMessagePlanner(
                                           userToken: String,
                                           override val planContext: PlanContext
                                         ) extends Planner[String] {
  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate token
      _ <- IO(logger.info(s"[Step 1] 验证Token是否有效: ${userToken}"))
      _ <- validateToken(userToken)

      // Step 2: Retrieve userID
      _ <- IO(logger.info(s"[Step 2] 提取与Token对应的用户ID"))
      userID <- getUserIDByToken(userToken)
      _ <- IO(logger.info(s"[Step 2] 成功提取用户ID: ${userID}"))

    } yield userID
  }

  private def validateToken(token: String)(using PlanContext): IO[Unit] = {
    for {
      // 1.1 Check if token is empty
      _ <- IO(logger.info(s"[Step 1.1] 检查Token是否为空"))
      _ <- if (token.isEmpty) {
        val errorMessage = "Token不能为空"
        IO(logger.error(errorMessage)) >> IO.raiseError(new IllegalArgumentException(errorMessage))
      } else IO(logger.info(s"Token非空, 继续验证"))

      // 1.2 Check if token exists and is not expired
      _ <- IO(logger.info(s"[Step 1.2] 检查Token是否存在以及是否未过期"))
      tokenExists <- checkTokenExists(token)
      _ <- if (!tokenExists) {
        val errorMessage = "Token无效或不存在"
        IO(logger.error(errorMessage)) >> IO.raiseError(new IllegalArgumentException(errorMessage))
      } else IO(logger.info(s"Token有效"))
    } yield ()
  }

  private def checkTokenExists(token: String)(using PlanContext): IO[Boolean] = {
    val sql =
      s"""
        SELECT COUNT(*)
        FROM ${schemaName}.login_token_table
        WHERE token = ?
          AND expires_at > now();
       """
    for {
      _ <- IO(logger.info(s"[Database Query] 验证Token有效性查询SQL:\n${sql}"))
      exists <- readDBInt(sql, List(SqlParameter("String", token))).map(_ > 0)
      _ <- IO(logger.info(s"[Database Query] Token在数据库中是否有效: ${exists}"))
    } yield exists
  }

  private def getUserIDByToken(token: String)(using PlanContext): IO[String] = {
    val sql =
      s"""
        SELECT user_id
        FROM ${schemaName}.login_token_table
        WHERE token = ?;
       """
    for {
      _ <- IO(logger.info(s"[Database Query] 查询UserID的SQL:\n${sql}"))
      userID <- readDBString(sql, List(SqlParameter("String", token))).handleErrorWith { e =>
        val errorMessage = s"通过Token获取UserID时发生错误: ${e.getMessage}"
        IO(logger.error(errorMessage)) >> IO.raiseError(new IllegalArgumentException("无法通过Token找到对应的用户"))
      }
      _ <- IO(logger.info(s"[Database Query] 成功提取UserID: ${userID}"))
    } yield userID
  }
}