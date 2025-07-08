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
      _ <- IO(logger.info(s"[Step 3] 开始加载用户战斗卡组: userID=${userID}"))
      result <- loadUserBattleDeck(userID)
      _ <- IO(logger.info(s"[Step 3] 加载完成，战斗卡组: ${result}"))

    } yield result
  }
}
