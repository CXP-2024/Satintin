package Utils

import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import Common.API.PlanContext
import Common.Object.SqlParameter
import cats.effect.IO
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

/**
 * 资产交易统一入口服务
 * 提供完整的资产交易流程和统一的接口
 */
case object AssetTransactionFacade {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 执行完整的资产交易流程
   * 包括资产修改和交易记录创建
   */
  def executeAssetTransaction(
    userID: String,
    transactionType: String,
    changeAmount: Int,
    changeReason: String
  )(using PlanContext): IO[String] = {
    for {
      _ <- AssetStatusService.modifyAsset(userID, changeAmount)
      
      // 创建交易记录
      transactionID <- TransactionService.createTransactionRecord(userID, transactionType, changeAmount, changeReason)
      
    } yield s"交易完成，交易ID: ${transactionID}"
  }
}