package Impl


import Utils.UserManagementProcess.getUserByID
import Utils.UserManagementProcess.deleteUserRecord
import Objects.UserService.UserRole
import Objects.UserService.User
import APIs.UserService.GetUserIDByTokenMessage
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import org.joda.time.DateTime
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
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
import APIs.UserService.GetUserIDByTokenMessage
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class DeleteUserMessagePlanner(
    adminToken: String,
    userID: String,
    override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  /**
   * 核心逻辑：验证管理员权限，并执行删除用户操作
   */
  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: 验证调用者是否具有管理员权限
      _ <- IO(logger.info(s"[DeleteUserMessagePlanner] 验证调用者是否具有管理员权限"))
      adminVerification <- verifyAdminRole(adminToken)
      _ <-
        if (!adminVerification) {
          IO(logger.error("[DeleteUserMessagePlanner] 调用者的Token无效或权限不足（非管理员）")) >>
            IO.raiseError(new IllegalAccessException("无效的Token或权限不足（非管理员）"))
        } else {
          IO(logger.info("[DeleteUserMessagePlanner] 调用者验证通过，具有管理员权限"))
        }

      // Step 2: 删除指定的用户记录
      _ <- IO(logger.info(s"[DeleteUserMessagePlanner] 准备删除用户记录, userID=${userID}"))
      deletionResult <- deleteUserRecord(userID).attempt

      // Step 3: 处理删除操作结果并返回
      result <- deletionResult match {
        case Right(successMessage) =>
          IO(logger.info(s"[DeleteUserMessagePlanner] 删除用户记录成功：userID=${userID}, result=${successMessage}")) >>
            IO.pure("删除成功")
        case Left(ex) =>
          IO(logger.error(s"[DeleteUserMessagePlanner] 删除用户记录失败: ${ex.getMessage}")) >>
            IO.raiseError(new RuntimeException(s"删除失败，原因: ${ex.getMessage}"))
      }
    } yield result
  }

  /**
   * 验证调用者是否具有管理员权限
   *
   * 验证步骤：
   * 1. 调用 `GetUserIDByTokenMessage` 验证Token有效性，并获取调用者的 userID。
   * 2. 根据 userID 调用 `getUserByID` 获取用户信息，检查其角色是否为管理员。
   * 3. 如果角色为管理员 (Admin)，则返回 true；否则返回 false。
   */
  private def verifyAdminRole(adminToken: String)(using PlanContext): IO[Boolean] = {
    for {
      // Step 1.1: 调用 `GetUserIDByTokenMessage` 获取 userID
      _ <- IO(logger.info(s"[verifyAdminRole] 验证Token: adminToken=${adminToken}"))
      userIDAttempt <- GetUserIDByTokenMessage(adminToken).send.attempt

      userID <- userIDAttempt match {
        case Right(value) =>
          IO(logger.info(s"[verifyAdminRole] adminToken 验证通过，获取 userID=${value}")) >> IO.pure(value)
        case Left(ex) =>
          val errorMsg = s"[verifyAdminRole] adminToken 验证失败: ${ex.getMessage}"
          IO(logger.error(errorMsg)) >> IO.raiseError(new IllegalArgumentException(errorMsg))
      }

      // Step 1.2: 调用 getUserByID 获取用户信息
      _ <- IO(logger.info(s"[verifyAdminRole] 获取用户信息 userID=${userID}"))
      user <- getUserByID(userID).attempt

      isAdmin <- user match {
        case Right(u) if u.role == UserRole.Admin =>
          IO(logger.info(s"[verifyAdminRole] 用户 ${u.userID} 验证通过，角色为管理员")) >> IO.pure(true)
        case Right(u) =>
          IO(logger.warn(s"[verifyAdminRole] 用户 ${u.userID} 验证失败，角色为普通用户")) >> IO.pure(false)
        case Left(ex) =>
          val errorMsg = s"[verifyAdminRole] 获取用户信息失败：${ex.getMessage}"
          IO(logger.error(errorMsg)) >> IO.raiseError(new IllegalArgumentException(errorMsg))
      }
    } yield isAdmin
  }
}