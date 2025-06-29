package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.UserAuthenticationProcess.{authenticateUser, setOnlineStatus}
import cats.effect.IO
import org.slf4j.LoggerFactory
import Objects.UserService.User
import io.circe._
import io.circe.generic.auto._
import io.circe.syntax._
import org.joda.time.DateTime
import cats.implicits._
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
import Utils.UserAuthenticationProcess.setOnlineStatus
import Objects.UserService.MessageEntry
import Utils.UserAuthenticationProcess.authenticateUser
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Objects.UserService.FriendEntry

case class LoginUserMessagePlanner(
    username: String,
    passwordHash: String,
    override val planContext: PlanContext
) extends Planner[String] {

  // Logger 实例
  private val logger = LoggerFactory.getLogger(getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: 验证用户名和密码的哈希
      _ <- IO(logger.info(s"[LoginUser] 验证用户登录信息, 用户名: ${username}"))
      userOpt <- authenticateUser(username, passwordHash)
      result <- userOpt match {
        case Some(user) =>
          // Step 2: 如果验证通过，更新用户在线状态为true
          for {
            _ <- updateOnlineStatus(user)
            _ <- IO(logger.info(s"[LoginUser] 登录成功, 返回用户ID: ${user.userID}"))
          } yield user.userID  // 返回 userID

        case None =>
          // 验证失败，返回错误
          IO.raiseError(new IllegalArgumentException("用户名或密码错误"))
      }
    } yield result
  }

  // 更新用户在线状态为在线
  private def updateOnlineStatus(user: User)(using PlanContext): IO[Boolean] = {
    for {
      _ <- IO(logger.info(s"[LoginUser] 用户验证成功, 将用户状态设置为在线, 用户ID: ${user.userID}"))
      _ <- setOnlineStatus(user.userID, isOnline = true)
    } yield true
  }
}