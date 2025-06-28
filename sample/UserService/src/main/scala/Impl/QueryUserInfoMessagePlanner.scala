package Impl


import Utils.UserManagementProcess.getUserByID
import Objects.UserService.UserRole
import Objects.UserService.User
import APIs.UserService.GetUserIDByTokenMessage
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import org.slf4j.LoggerFactory
import cats.effect.IO
import io.circe._
import org.joda.time.DateTime
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Common.ServiceUtils.schemaName
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
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class QueryUserInfoMessagePlanner(
  userToken: String,
  userID: String,
  override val planContext: PlanContext
) extends Planner[User] {
  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[User] = {
    for {
      // Step 1: 验证调用者的管理员角色权限
      _ <- IO(logger.info(s"[Step 1] 验证调用者是否为管理员 userToken=${userToken}"))
      _ <- validateAdminRole(userToken)

      // Step 2: 查询用户信息
      _ <- IO(logger.info(s"[Step 2] 根据 userID=${userID} 查询用户信息"))
      user <- fetchUserInfoByID(userID)

      _ <- IO(logger.info(s"[Step 3] 成功返回用户信息: ${user}"))
    } yield user
  }

  /**
   * 验证调用者是否具备管理员角色权限
   */
  private def validateAdminRole(userToken: String)(using PlanContext): IO[Unit] = {
    for {
      // Step 1.1: 根据token获取userID
      _ <- IO(logger.info("[Step 1.1] 通过 GetUserIDByTokenMessage 获取 userID"))
      tokenUserID <- GetUserIDByTokenMessage(userToken).send

      // Step 1.2: 获取调用者的用户信息
      _ <- IO(logger.info(s"[Step 1.2] 通过 userID=${tokenUserID} 获取用户信息"))
      callingUser <- fetchUserInfoByID(tokenUserID)

      // Step 1.3 & 1.4: 校验用户角色是否为管理员
      _ <- IO(logger.info(s"[Step 1.3] 校验调用者角色权限: 当前角色=${callingUser.role}"))
      _ <- checkAdminRole(callingUser.role, tokenUserID)
    } yield ()
  }

  /**
   * 校验是否为管理员角色
   */
  private def checkAdminRole(role: UserRole, userID: String): IO[Unit] = {
    if (role != UserRole.Admin) {
      val errorMessage = s"权限不足: 只有管理员角色能够调用此接口, 当前用户ID=${userID}, 角色=${role}"
      IO(logger.error(errorMessage)) >> IO.raiseError(new IllegalAccessException(errorMessage))
    } else {
      IO(logger.info(s"调用者角色校验通过: userID=${userID} 是管理员"))
    }
  }

  /**
   * 根据 userID 从数据库中获取用户信息
   */
  private def fetchUserInfoByID(userID: String)(using PlanContext): IO[User] = {
    getUserByID(userID).handleErrorWith { ex =>
      val errorMessage = s"无法获取指定的用户信息 userID=${userID}, 错误信息=${ex.getMessage}"
      IO(logger.error(errorMessage, ex)) >> IO.raiseError(ex)
    }
  }
}