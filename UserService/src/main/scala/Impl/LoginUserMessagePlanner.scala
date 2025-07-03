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
      userOpt <- UserAuthenticationProcess.authenticateUser(username, passwordHash)
      
      user <- userOpt match {
        case Some(user) => IO.pure(user)
        case None => 
          IO(logger.warn(s"用户登录失败，username=${username}")) >>
          IO.raiseError(new RuntimeException("用户名或密码错误"))
      }
      
      // Step 2: 生成usertoken
      usertoken <- IO(UUID.randomUUID().toString)
      _ <- IO(logger.info(s"生成usertoken: ${usertoken}"))
      
      // Step 3: 使用Utils中的更新用户在线状态函数
      _ <- UserAuthenticationProcess.setOnlineStatus(user.userID, true)
      _ <- IO(logger.info(s"用户${user.userID}在线状态已更新"))
      
      // Step 4: 返回用户ID作为token（这里直接返回userID作为token）
      _ <- IO(logger.info(s"登录成功，返回userID作为token: ${user.userID}"))
      
    } yield user.userID
  }
}