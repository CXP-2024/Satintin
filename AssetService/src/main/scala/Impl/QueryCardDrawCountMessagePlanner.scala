package Impl

import Utils.CardDrawCountService
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import org.slf4j.LoggerFactory

case class QueryCardDrawCountMessagePlanner(
  userID: String,
  poolType: String,
  override val planContext: PlanContext
) extends Planner[Int] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[Int] = {
    for {
      // Step 1: 验证输入参数
      _ <- IO(logger.info(s"[Step 1] 开始验证输入参数: poolType=${poolType}"))
      _ <- if (!Set("standard", "featured").contains(poolType)) {
        IO.raiseError(new IllegalArgumentException("卡池类型无效，必须是 'standard' 或 'featured'"))
      } else {
        IO(logger.info("[Step 1] 输入参数验证通过"))
      }

      _ <- IO(logger.info(s"[Step 3] 开始查询用户在${poolType}池的抽卡次数: userID=${userID}"))
      result <- CardDrawCountService.fetchCardDrawCount(userID, poolType)
      _ <- IO(logger.info(s"[Step 3] 查询完成，${poolType}池抽卡次数: ${result}"))

    } yield result
  }
}
