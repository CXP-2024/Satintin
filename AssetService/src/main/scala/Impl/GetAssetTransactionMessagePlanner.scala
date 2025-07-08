package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.TransactionService
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.generic.auto._
import io.circe.syntax._
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.AssetService.AssetTransaction
import org.joda.time.DateTime

case class GetAssetTransactionMessagePlanner(
  userID: String,
  override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
    override def plan(using context: PlanContext): IO[String] = {
    for {
      transactionHistory <- TransactionService.fetchTransactionHistory(userID)
      _ <- IO(logger.info(s"[GetAssetTransactionMessagePlanner] 交易历史获取成功，记录数: ${transactionHistory.length}"))

      // Step 3: 序列化返回结果
      result = transactionHistory.asJson.noSpaces
      _ <- IO(logger.info("[GetAssetTransactionMessagePlanner] 交易历史序列化完成"))

    } yield result
  }
}
