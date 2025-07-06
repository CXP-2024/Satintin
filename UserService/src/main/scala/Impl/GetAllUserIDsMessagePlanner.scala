package Impl

import APIs.UserService.GetAllUserIDsMessage
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
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class GetAllUserIDsMessagePlanner(
    override val planContext: PlanContext
) extends Planner[List[String]] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  
  override def plan(using PlanContext): IO[List[String]] = {
    for {
      _ <- IO(logger.info(s"[GetAllUserIDs] 开始获取所有用户ID"))
      
      // Step 1: Query all user IDs from database
      querySQL <- IO {
        s"SELECT user_id FROM ${schemaName}.user_table ORDER BY user_id"
      }
      _ <- IO(logger.info(s"[GetAllUserIDs] 查询SQL: ${querySQL}"))
        // Step 2: Execute query and extract user IDs
      result <- readDBRows(querySQL, List()).flatMap { rows =>
        IO {
          val userIDs = rows.map { row =>
            decodeField[String](row, "user_id")
          }
          logger.info(s"[GetAllUserIDs] 查询成功，共找到 ${userIDs.length} 个用户ID")
          logger.debug(s"[GetAllUserIDs] 用户ID列表: ${userIDs.mkString(", ")}")
          userIDs
        }
      }
    } yield result
  }
}
