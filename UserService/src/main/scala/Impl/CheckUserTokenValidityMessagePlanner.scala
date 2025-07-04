package Impl

import Common.API.{PlanContext, Planner}
import Utils.UserTokenValidator
import cats.effect.IO
import org.slf4j.LoggerFactory

/**
 * 检查用户Token有效性的Planner
 * @param userToken 用户登录Token
 */
case class CheckUserTokenValidityMessagePlanner(
  userToken: String,
  override val planContext: PlanContext
) extends Planner[Boolean] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[Boolean] = {
    for {
      _ <- IO(logger.info(s"[CheckUserTokenValidityMessagePlanner] 开始检查用户Token有效性"))
      isValid <- UserTokenValidator.isTokenValid(userToken)
      _ <- IO(logger.info(s"[CheckUserTokenValidityMessagePlanner] 检查完成，Token有效性: $isValid"))
    } yield isValid
  }
}