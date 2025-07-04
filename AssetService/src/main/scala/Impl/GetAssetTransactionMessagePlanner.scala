package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.AssetTransactionProcess
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
  userToken: String,
  override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  
  override def plan(using context: PlanContext): IO[String] = {
    for {
      // Step 1: 使用Utils验证用户身份
      _ <- IO(logger.info("[GetAssetTransactionMessagePlanner] 验证用户身份"))
      // validation to be completed
      userID <- IO(userToken) // 假设 userToken 已经解析为 userID
      _ <- IO(logger.info(s"[GetAssetTransactionMessagePlanner] 用户验证成功，userID=${userID}"))

      // Step 2: 获取交易历史
      _ <- IO(logger.info("[GetAssetTransactionMessagePlanner] 获取用户交易历史"))
      transactionHistory <- AssetTransactionProcess.fetchTransactionHistory(userID)
      _ <- IO(logger.info(s"[GetAssetTransactionMessagePlanner] 交易历史获取成功，记录数: ${transactionHistory.length}"))

      // Step 3: 序列化返回结果
      result = transactionHistory.asJson.noSpaces
      _ <- IO(logger.info("[GetAssetTransactionMessagePlanner] 交易历史序列化完成"))

    } yield result
  }
}
