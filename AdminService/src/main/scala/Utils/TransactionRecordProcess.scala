package Utils

import Common.API.PlanContext
import Common.DBAPI._
import Common.Object.SqlParameter
import cats.effect.IO
import org.slf4j.LoggerFactory
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import org.joda.time.DateTime
import java.util.UUID

case object TransactionRecordProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 创建交易记录
   */
  def createTransactionRecord(
    userID: String,
    transactionType: String,
    changeAmount: Int,
    changeReason: String
  )(using PlanContext): IO[String] = {
    for {
      _ <- IO {
        if (userID.isBlank) throw new IllegalArgumentException("用户ID不能为空")
        if (!Set("CHARGE", "PURCHASE", "REWARD", "ADMIN_REWARD").contains(transactionType)) 
          throw new IllegalArgumentException(s"交易类型不允许: ${transactionType}")
        if (changeAmount == 0) 
          throw new IllegalArgumentException("变动的金额不能为0")
      }
  
      transactionID <- IO(UUID.randomUUID().toString)
      timestamp <- IO(DateTime.now())
      _ <- IO(logger.info(s"[createTransactionRecord] 生成交易ID：${transactionID}，时间戳：${timestamp}"))
  
      transactionInsertSql = 
        s"""
         INSERT INTO assetservice.asset_transaction_table
         (transaction_id, user_id, transaction_type, change_amount, change_reason, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)
        """
      transactionParams <- IO {
        List(
          SqlParameter("String", transactionID),
          SqlParameter("String", userID),
          SqlParameter("String", transactionType),
          SqlParameter("Int", changeAmount.toString),
          SqlParameter("String", changeReason),
          SqlParameter("DateTime", timestamp.getMillis.toString)
        )
      }
      _ <- IO(logger.info(s"[createTransactionRecord] 准备插入资产交易记录，SQL：${transactionInsertSql}, 参数：${transactionParams}"))
      _ <- writeDB(transactionInsertSql, transactionParams)
      _ <- IO(logger.info(s"[createTransactionRecord] 交易记录已插入，交易ID：${transactionID}"))
    } yield transactionID
  }
}