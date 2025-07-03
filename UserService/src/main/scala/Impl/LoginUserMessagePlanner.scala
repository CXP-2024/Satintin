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
      // Step 1: 使用Utils中的验证用户名和密码函数
      _ <- IO(logger.info(s"开始验证用户登录，username=${username}"))
      userInfo <- UserAuthenticationProcess.validateUserCredentials(username, passwordHash)
      
      // Step 2: 生成usertoken
      usertoken <- IO(UUID.randomUUID().toString)
      _ <- IO(logger.info(s"生成usertoken: ${usertoken}"))
      
      // Step 3: 使用Utils中的更新用户在线状态函数
      _ <- UserAuthenticationProcess.updateUserOnlineStatus(userInfo._1, usertoken)
      
      // Step 4: 返回结果
      loginResult = Json.obj(
        "userID" -> Json.fromString(userInfo._1),
        "userToken" -> Json.fromString(usertoken),
        "message" -> Json.fromString("登录成功")
      ).noSpaces
      
      _ <- IO(logger.info(s"登录成功，返回结果: ${loginResult}"))
      
    } yield loginResult
  }
}