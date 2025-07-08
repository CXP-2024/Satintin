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

case class DeductAssetMessagePlanner(
  userID: String,
  deductAmount: Int,
  override val planContext: PlanContext
) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"[DeductAssetMessagePlanner] 检查用户资产是否足够"))
      currentAsset <- AssetStatusService.fetchAssetStatus(userID)
      _ <- IO {
        if (currentAsset < deductAmount) 
          throw new IllegalStateException(s"用户资产不足，当前资产: ${currentAsset}, 请求扣减: ${deductAmount}")
      }
      _ <- IO(logger.info(s"[DeductAssetMessagePlanner] 用户资产检查通过，当前资产: ${currentAsset}"))

      // Step 3: 执行扣减操作
      _ <- IO(logger.info(s"[DeductAssetMessagePlanner] 执行扣减操作"))
      _ <- AssetStatusService.modifyAsset(userID, -deductAmount)
      _ <- IO(logger.info(s"[DeductAssetMessagePlanner] 资产扣减成功"))

      // Step 4: 记录交易
      _ <- IO(logger.info(s"[DeductAssetMessagePlanner] 记录交易日志"))
      transactionID <- TransactionService.createTransactionRecord(userID, "PURCHASE", -deductAmount, "资产扣减")
      _ <- IO(logger.info(s"[DeductAssetMessagePlanner] 交易记录成功，交易ID=${transactionID}"))

    } yield "资产扣减成功！"
  }
}