package Impl

import Common.API.{PlanContext, Planner}
import Utils.UserStatusProcess
import Objects.UserService.User
import cats.effect.IO
import org.slf4j.LoggerFactory

/**
 * 获取用户完整状态信息的Planner
 * @param userID 目标用户ID
 */
case class FetchUserStatusMessagePlanner(
  userID: String,
  override val planContext: PlanContext
) extends Planner[Option[User]] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[Option[User]] = {
    for {
      // 直接调用 UserStatusProcess.fetchUserStatus
      _ <- IO(logger.info(s"[FetchUserStatusMessagePlanner] 开始获取用户状态信息: userID=$userID"))
      userStatus <- UserStatusProcess.fetchUserStatus(userID)
      _ <- userStatus match {
        case Some(user) => IO(logger.info(s"[FetchUserStatusMessagePlanner] 用户状态获取成功: ${user.userName}"))
        case None => IO(logger.info(s"[FetchUserStatusMessagePlanner] 用户不存在: userID=$userID"))
      }
    } yield userStatus
  }
}