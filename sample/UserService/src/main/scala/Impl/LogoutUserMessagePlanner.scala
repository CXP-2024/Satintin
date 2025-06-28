package Impl


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

import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class LogoutUserMessagePlanner(
                                     userToken: String,
                                     override val planContext: PlanContext
                                   ) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate if the userToken exists in LoginTokenTable
      _ <- IO(logger.info(s"[Step 1] 验证userToken=${userToken}是否存在于LoginTokenTable"))
      tokenExists <- checkTokenExists()
      _ <- if (!tokenExists) {
        IO(logger.error(s"[Step 1.1] userToken=${userToken}不存在，无法继续登出操作"))
        IO.raiseError(new IllegalArgumentException("用户userToken不存在"))
      } else IO(logger.info(s"[Step 1.2] userToken=${userToken}验证通过"))

      // Step 2: Delete the token record from the table
      _ <- IO(logger.info(s"[Step 2] 删除LoginTokenTable中的记录，userToken=${userToken}"))
      _ <- deleteToken()

      // Step 3: Return the success message
      result <- IO("登出成功")
      _ <- IO(logger.info(s"[Step 3] 返回操作结果: ${result}"))
    } yield result
  }

  /** Step 1.1: 检查数据库中是否存在对应的token记录 */
  private def checkTokenExists()(using PlanContext): IO[Boolean] = {
    for {
      _ <- IO(logger.info(s"[checkTokenExists] 查询LoginTokenTable，判断userToken=${userToken}是否存在"))
      sql <- IO {
        s"""
          SELECT EXISTS (
            SELECT 1
            FROM ${schemaName}.login_token_table
            WHERE token = ?
          );
        """
      }
      _ <- IO(logger.debug(s"[checkTokenExists] 执行SQL查询: ${sql}"))
      exists <- readDBBoolean(sql, List(SqlParameter("String", userToken)))
    } yield exists
  }

  /** Step 2: 删除数据库中对应token的记录 */
  private def deleteToken()(using PlanContext): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"[deleteToken] 从LoginTokenTable中删除userToken=${userToken}"))
      sql <- IO {
        s"""
          DELETE FROM ${schemaName}.login_token_table
          WHERE token = ?;
        """
      }
      _ <- IO(logger.debug(s"[deleteToken] 执行SQL删除语句: ${sql}"))
      _ <- writeDB(sql, List(SqlParameter("String", userToken))).void
      _ <- IO(logger.info(s"[deleteToken] userToken=${userToken}删除成功"))
    } yield ()
  }
}