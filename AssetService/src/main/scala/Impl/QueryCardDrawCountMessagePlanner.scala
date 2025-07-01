package Impl

import Utils.AssetTransactionProcess.fetchCardDrawCount
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import org.slf4j.LoggerFactory

case class QueryCardDrawCountMessagePlanner(
  userToken: String,
  override val planContext: PlanContext
) extends Planner[Int] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[Int] = {
    for {
      // Step 1: Validate input parameters
      _ <- IO(logger.info(s"[Step 1] 开始验证输入参数: userToken=${userToken}"))
      _ <- if (userToken == null || userToken.trim.isEmpty) {
        IO.raiseError(new IllegalArgumentException("用户Token不能为空"))
      } else {
        IO(logger.info("[Step 1] 输入参数验证通过"))
      }

      // Step 2: Use userToken as userID (consistent with other services)
      userID = userToken
      _ <- IO(logger.info(s"[Step 2] 使用Token作为用户ID: userID=${userID}"))

      // Step 3: Fetch card draw count
      _ <- IO(logger.info(s"[Step 3] 开始查询用户抽卡次数: userID=${userID}"))
      result <- fetchCardDrawCount(userID)
      _ <- IO(logger.info(s"[Step 3] 查询完成，抽卡次数: ${result}"))

    } yield result
  }
}
