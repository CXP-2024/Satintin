package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.{AssetStatusService, TransactionService}
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class RewardAssetMessagePlanner(
  userID: String,
  rewardAmount: Int,
  override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  /**
   * Main execution plan.
   *
   * @return IO[String]
   */  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 2: 验证奖励金额
      _ <- IO {
        if (rewardAmount <= 0) throw new IllegalArgumentException("奖励金额必须大于0")
      }
      _ <- IO(logger.info(s"[Step 2] 奖励金额验证通过: ${rewardAmount}"))      // Step 3: 修改资产
      _ <- IO(logger.info("[Step 3] 修改用户资产"))
      _ <- AssetStatusService.modifyAsset(userID, rewardAmount)
      _ <- IO(logger.info("[Step 3] 资产修改完成"))

      // Step 4: 创建交易记录
      _ <- IO(logger.info("[Step 4] 创建奖励交易记录"))
      transactionID <- TransactionService.createTransactionRecord(
        userID, 
        "REWARD", 
        rewardAmount, 
        "系统奖励"
      )
      _ <- IO(logger.info(s"[Step 4] 交易记录成功，交易ID=${transactionID}"))

      _ <- IO(logger.info("RewardAssetMessagePlanner 执行完成"))
    } yield s"奖励发放成功，交易ID: ${transactionID}"
  }
}