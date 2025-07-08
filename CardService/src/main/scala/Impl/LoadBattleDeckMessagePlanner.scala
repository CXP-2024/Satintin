package Impl

import Utils.CardBattleDeckUtils.loadUserBattleDeck
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import org.slf4j.LoggerFactory

case class LoadBattleDeckMessagePlanner(
  userID: String,
  override val planContext: PlanContext
) extends Planner[List[String]] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[List[String]] = {
    for {
      // Step 1: Validate input parameters
      _ <- IO(logger.info(s"[Step 1] 开始验证输入参数: userID=${userID}"))
      // validation to be completed

      _ <- IO(logger.info(s"[Step 2] 使用Token作为用户ID: userID=${userID}"))

      // Step 3: Load user battle deck configuration
      _ <- IO(logger.info(s"[Step 3] 开始加载用户战斗卡组: userID=${userID}"))
      result <- loadUserBattleDeck(userID)
      _ <- IO(logger.info(s"[Step 3] 加载完成，战斗卡组: ${result}"))

    } yield result
  }
}
