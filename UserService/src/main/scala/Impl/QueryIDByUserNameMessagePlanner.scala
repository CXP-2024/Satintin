package Impl

import APIs.UserService.QueryIDByUserNameMessage
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

case class QueryIDByUserNameMessagePlanner(
    username: String,
    override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  
  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate input parameter
      _ <- IO {
        if (username == null || username.trim.isEmpty)
          throw new IllegalArgumentException("用户名不能为空")
      }
      _ <- IO(logger.info(s"[QueryIDByUserName] 开始根据用户名查询用户ID，username='${username}'"))
      
      // Step 2: Query user by username
      querySQL <- IO {
        s"SELECT user_id FROM ${schemaName}.user_table WHERE username = ?"
      }
      queryParams <- IO {
        List(SqlParameter("String", username))
      }
      _ <- IO(logger.info(s"[QueryIDByUserName] 查询SQL: ${querySQL}，参数: ${queryParams}"))
      
      // Step 3: Execute query and handle result
      result <- readDBJsonOptional(querySQL, queryParams).flatMap {
        case Some(json) =>
          // User found, extract user ID
          val userID = decodeField[String](json, "user_id")
          IO {
            logger.info(s"[QueryIDByUserName] 查询成功，用户名'${username}'对应的用户ID为: ${userID}")
          } >> IO.pure(userID)
        case None =>
          // User not found
          val errorMessage = s"[QueryIDByUserName] 用户名'${username}'不存在"
          IO(logger.warn(errorMessage)) >>
          IO.raiseError(new RuntimeException(s"用户名'${username}'不存在"))
      }
    } yield result
  }
}
