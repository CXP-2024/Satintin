package Impl

import APIs.UserService.LoginUserMessage
import Utils.UserAuthenticationProcess
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
import java.util.UUID

case class LoginUserMessagePlanner(
    username: String,
    passwordHash: String,
    override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: 使用Utils中的现有authenticateUser方法
      _ <- IO(logger.info(s"开始验证用户登录"))
      userOpt <- UserAuthenticationProcess.authenticateUser(username, passwordHash)
      
      user <- userOpt match {
        case Some(user) => IO.pure(user)
        case None => IO.raiseError(new IllegalArgumentException("用户名或密码错误"))
      }
      
      // Step 2: 生成usertoken
      usertoken <- IO(UUID.randomUUID().toString)
      _ <- IO(logger.info(s"生成usertoken: ${usertoken}"))
      
      // Step 3: 更新用户在线状态和token
      _ <- updateUserTokenAndStatus(user.userID, usertoken)
      
      // Step 4: 返回结果
      loginResult = Json.obj(
        "userID" -> Json.fromString(user.userID),
        "userToken" -> Json.fromString(usertoken),
        "message" -> Json.fromString("登录成功")
      ).noSpaces
      
      _ <- IO(logger.info(s"登录成功，返回结果: ${loginResult}"))
      
    } yield loginResult
  }

  /**
   * 更新用户token和在线状态
   */
  private def updateUserTokenAndStatus(userID: String, usertoken: String)(using PlanContext): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"更新用户token和在线状态: userID=${userID}, usertoken=${usertoken}"))
      
      _ <- writeDB(
        s"UPDATE ${schemaName}.user_table SET usertoken = ?, is_online = true WHERE user_id = ?;",
        List(
          SqlParameter("String", usertoken),
          SqlParameter("String", userID)
        )
      )
      
      _ <- IO(logger.info(s"用户token和在线状态更新完成"))
    } yield ()
  }
}