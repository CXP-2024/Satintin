package Impl

import Utils.AssetTransactionProcess.updateCardDrawCount
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import org.slf4j.LoggerFactory

case class UpdateCardDrawCountMessagePlanner(
  userToken: String,
  poolType: String,
  drawCount: Int,
  override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate input parameters
      _ <- IO(logger.info(s"[Step 1] 开始验证输入参数: userToken=${userToken}, poolType=${poolType}, drawCount=${drawCount}"))
      _ <- if (userToken == null || userToken.trim.isEmpty) {
        IO.raiseError(new IllegalArgumentException("用户Token不能为空"))
      } else if (!Set("standard", "featured").contains(poolType)) {
        IO.raiseError(new IllegalArgumentException(s"池类型不支持: ${poolType}，只支持 'standard' 或 'featured'"))
      } else if (drawCount < 0) {
        IO.raiseError(new IllegalArgumentException("设定抽卡次数不能小于0"))
      } else {
        IO(logger.info("[Step 1] 输入参数验证通过"))
      }

      // Step 2: Use userToken as userID (consistent with other services)
      userID = userToken
      _ <- IO(logger.info(s"[Step 2] 使用Token作为用户ID: userID=${userID}"))      // Step 3: Set card draw count for specified pool
      _ <- IO(logger.info(s"[Step 3] 开始设置用户${poolType}池抽卡次数: userID=${userID}, drawCount=${drawCount}"))
      result <- updateCardDrawCount(userID, poolType, drawCount)
      _ <- IO(logger.info(s"[Step 3] ${poolType}池抽卡次数设置完成: ${result}"))

    } yield result
  }
}
