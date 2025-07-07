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
 * 交易服务
 * 负责处理资产交易记录的创建和查询
 */
case object TransactionService {
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
      // Step 1: Validate input parameters
      _ <- IO {
        if (userID.isBlank) throw new IllegalArgumentException("用户ID不能为空")
        if (!Set("CHARGE", "PURCHASE", "REWARD").contains(transactionType))
          throw new IllegalArgumentException(s"交易类型不允许: ${transactionType}")
        if (changeAmount == 0)
          throw new IllegalArgumentException("变动的金额不能为0")
      }

      // Step 2.1: Generate a unique transaction ID
      transactionID <- IO(java.util.UUID.randomUUID().toString)
      timestamp <- IO(DateTime.now())
      _ <- IO(logger.info(s"[createTransactionRecord] 生成交易ID：${transactionID}，时间戳：${timestamp}"))

      // Step 2.2: Insert transaction record into the AssetTransactionTable
      transactionInsertSql = 
        s"""
         INSERT INTO ${schemaName}.asset_transaction_table
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

      // Note: 此方法只做交易记录，不直接修改资产
      // 资产修改应该通过 AssetStatusService.modifyAsset 方法完成
      _ <- IO(logger.info(s"[createTransactionRecord] 交易记录已插入，交易ID：${transactionID}"))
    } yield transactionID
  }

  /**
   * 获取用户的交易历史记录
   */
  def fetchTransactionHistory(userID: String)(using PlanContext): IO[List[Objects.AssetService.AssetTransaction]] = {
    for {
      // Step 1: Validate input parameter
      _ <- IO {
        if (userID == null || userID.trim.isEmpty)
          throw new IllegalArgumentException("用户ID不能为空或无效")
      }
      _ <- IO(logger.info(s"[fetchTransactionHistory] 开始查询用户交易记录，userID='${userID}'"))

      // Step 2: Construct SQL query to fetch all transactions for the user
      querySQL <- IO {
        s"""
        SELECT transaction_id, user_id, transaction_type, change_amount, change_reason, timestamp
        FROM ${schemaName}.asset_transaction_table
        WHERE user_id = ?
        ORDER BY timestamp DESC
        """
      }
      parameters <- IO {
        List(SqlParameter("String", userID))
      }
      _ <- IO(logger.info(s"[fetchTransactionHistory] 查询SQL: ${querySQL}，参数: ${parameters}"))

      // Step 3: Execute database query and retrieve transaction records
      transactionRows <- readDBRows(querySQL, parameters)
      _ <- IO(logger.info(s"[fetchTransactionHistory] 查询到 ${transactionRows.length} 条交易记录"))

      // Step 4: Convert rows to AssetTransaction objects
      transactions <- IO {
        transactionRows.map { row =>
          Objects.AssetService.AssetTransaction(
            transactionID = decodeField[String](row, "transaction_id"),
            userID = decodeField[String](row, "user_id"),
            transactionType = decodeField[String](row, "transaction_type"),
            changeAmount = decodeField[Int](row, "change_amount"),
            changeReason = decodeField[String](row, "change_reason"),
            timestamp = new DateTime(decodeField[Long](row, "timestamp"))
          )
        }
      }
      _ <- IO(logger.info(s"[fetchTransactionHistory] 成功转换交易记录，共 ${transactions.length} 条"))

    } yield transactions
  }
}
