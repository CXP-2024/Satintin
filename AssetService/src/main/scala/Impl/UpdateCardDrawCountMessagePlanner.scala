package Impl

import Utils.AssetTransactionProcess.updateCardDrawCount
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import org.slf4j.LoggerFactory

case class UpdateCardDrawCountMessagePlanner(
  userToken: String,
  drawCount: Int,
  isIncrement: Boolean = true,  // 新增参数：true为增加，false为设置
  override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate input parameters
      _ <- IO(logger.info(s"[Step 1] 开始验证输入参数: userToken=${userToken}, drawCount=${drawCount}, isIncrement=${isIncrement}"))
      _ <- if (userToken == null || userToken.trim.isEmpty) {
        IO.raiseError(new IllegalArgumentException("用户Token不能为空"))
      } else if (isIncrement && drawCount <= 0) {
        IO.raiseError(new IllegalArgumentException("增量抽卡次数必须大于0"))
      } else if (!isIncrement && drawCount < 0) {
        IO.raiseError(new IllegalArgumentException("设定抽卡次数不能小于0"))
      } else {
        IO(logger.info("[Step 1] 输入参数验证通过"))
      }

      // Step 2: Use userToken as userID (consistent with other services)
      userID = userToken
      _ <- IO(logger.info(s"[Step 2] 使用Token作为用户ID: userID=${userID}"))

      // Step 3: Update card draw count
      actionType = if (isIncrement) "增加" else "设置"
      _ <- IO(logger.info(s"[Step 3] 开始${actionType}用户抽卡次数: userID=${userID}, drawCount=${drawCount}"))
      result <- updateCardDrawCount(userID, drawCount, isIncrement)
      _ <- IO(logger.info(s"[Step 3] 抽卡次数${actionType}完成: ${result}"))

    } yield result
  }
}
