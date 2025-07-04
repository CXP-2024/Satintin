package Impl

import Common.API.{PlanContext, Planner}
import Utils.UserTokenValidator
import cats.effect.IO
import org.slf4j.LoggerFactory

/**
 * 验证用户Token并获取用户ID的Planner
 * @param userToken 用户登录Token
 */
case class ValidateUserTokenMessagePlanner(
  userToken: String,
  override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"[ValidateUserTokenMessagePlanner] 开始验证用户Token并获取用户ID"))
      userID <- UserTokenValidator.getUserIDFromToken(userToken)
      _ <- IO(logger.info(s"[ValidateUserTokenMessagePlanner] 验证成功，用户ID: $userID"))
    } yield userID
  }
}