package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import Common.API.{PlanContext, Planner}
import Common.Object.SqlParameter
import cats.effect.IO
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.API.PlanContext
import Objects.AdminService.UserActionLog
import Utils.AssetTransactionProcess.modifyAsset
import Utils.AssetTransactionProcess.fetchAssetStatus
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Common.Object.{ParameterList, SqlParameter}
import Utils.AssetTransactionProcess.createTransactionRecord

case object AssetTransactionProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  
  def fetchAssetStatus(userID: String)(using PlanContext): IO[Int] = {
    // Step 1: Validate input parameter
    if (userID == null || userID.trim.isEmpty) {
      IO {
        logger.info(s"[fetchAssetStatus] 输入的userID无效，userID='${userID}'")
      } >> IO.raiseError(new IllegalArgumentException("用户ID不能为空或无效"))
    } else {
      // Step 2: Construct SQL query
      IO {
        logger.info(s"[fetchAssetStatus] 开始查询用户原石资产状态，userID='${userID}'")
      } >>
      IO {
        val querySQL = s"SELECT stone_amount FROM ${schemaName}.user_asset_status_table WHERE user_id = ?"
        val parameters = List(SqlParameter("String", userID))
        (querySQL, parameters)
      }.flatMap { case (querySQL, parameters) =>
        // Step 3: Execute database query and retrieve asset status
        IO(logger.info(s"[fetchAssetStatus] 查询SQL: ${querySQL}，参数: ${parameters}")) >>
        readDBInt(querySQL, parameters).flatMap { assetStatus =>
          IO {
            logger.info(s"[fetchAssetStatus] 查询成功，用户原石数量为: ${assetStatus}")
          } >> IO.pure(assetStatus)
        }
      }
    }
  }
  
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
        if (!Set("充值", "消费", "奖励").contains(transactionType)) 
          throw new IllegalArgumentException(s"交易类型不允许: ${transactionType}")
        if (changeAmount == 0) 
          throw new IllegalArgumentException("变动的金额不能为0")
      }
  
      // Step 2.1: Generate a unique transaction ID
      transactionID <- IO(java.util.UUID.randomUUID().toString)
      timestamp <- IO(DateTime.now())
      _ <- IO(logger.info(s"生成交易ID：${transactionID}，时间戳：${timestamp}"))
  
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
          SqlParameter("Long", timestamp.getMillis.toString)
        )
      }
      _ <- IO(logger.info(s"准备插入资产交易记录，SQL：${transactionInsertSql}, 参数：${transactionParams}"))
      _ <- writeDB(transactionInsertSql, transactionParams)
  
      // Step 3.1: Fetch current asset status
      currentAsset <- fetchAssetStatus(userID)
      _ <- IO(logger.info(s"当前用户的资产状态: ${currentAsset}"))
  
      // Step 3.2: Calculate new asset amount and validate
      newAssetAmount <- IO {
        val updatedAsset = currentAsset + changeAmount
        if (updatedAsset < 0) 
          throw new IllegalStateException(
            s"用户的资产不足，操作取消 -> 当前资产 ${currentAsset}, 请求变动 ${changeAmount}"
          )
        updatedAsset
      }
  
      // Step 3.3: Update the asset status
      _ <- IO(logger.info(s"更新用户的资产数量，新的资产值：${newAssetAmount}"))
      _ <- modifyAsset(userID, changeAmount)
  
      // Step 4: Log user action
      actionLogID <- IO(java.util.UUID.randomUUID().toString)
      actionType = "资产变动"
      actionDetail = s"交易ID: ${transactionID}, 类型: ${transactionType}, 数量: ${changeAmount}, 原因: ${changeReason}"
      userLogSql = 
        s"""
         INSERT INTO ${schemaName}.user_action_log
         (action_log_id, user_id, action_type, action_detail, action_time)
         VALUES (?, ?, ?, ?, ?)
        """
      userLogParams <- IO {
        List(
          SqlParameter("String", actionLogID),
          SqlParameter("String", userID),
          SqlParameter("String", actionType),
          SqlParameter("String", actionDetail),
          SqlParameter("Long", timestamp.getMillis.toString)
        )
      }
      _ <- IO(logger.info(s"插入用户操作日志，SQL：${userLogSql}, 参数：${userLogParams}"))
      _ <- writeDB(userLogSql, userLogParams)
  
      // Step 5: Final logging and return success message
      _ <- IO(logger.info("交易流程已完成，记录生成成功"))
    } yield "交易记录已生成!"
  }
  
  def modifyAsset(userID: String, changeAmount: Int)(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate input parameters
      _ <- IO {
        if (userID == null || userID.trim.isEmpty)
          throw new IllegalArgumentException("用户ID不能为空或无效")
        if (changeAmount == 0)
          throw new IllegalArgumentException("变动金额不能为0")
      }
      _ <- IO(logger.info(s"[modifyAsset] 输入参数验证成功，userID=${userID}, changeAmount=${changeAmount}"))
  
      // Step 2: Fetch current asset status
      currentAsset <- fetchAssetStatus(userID)
      _ <- IO(logger.info(s"[modifyAsset] 当前用户资产数量：${currentAsset}"))
  
      // Step 3.1: Calculate new asset amount
      newAssetAmount <- IO {
        val updatedAmount = currentAsset + changeAmount
        if (updatedAmount < 0)
          throw new IllegalStateException(s"用户资产不足，当前资产: ${currentAsset}, 请求变动: ${changeAmount}")
        updatedAmount
      }
      _ <- IO(logger.info(s"[modifyAsset] 新资产数量计算成功，新资产数量为：${newAssetAmount}"))
  
      // Step 3.2: Update UserAssetStatusTable
      updateAssetSql <- IO {
        s"""
        UPDATE ${schemaName}.user_asset_status_table
        SET stone_amount = ?, last_updated = ?
        WHERE user_id = ?
        """
      }
      updateAssetParams <- IO {
        List(
          SqlParameter("Int", newAssetAmount.toString),
          SqlParameter("Long", DateTime.now().getMillis.toString),
          SqlParameter("String", userID)
        )
      }
      _ <- IO(logger.info(s"[modifyAsset] 正在更新用户资产，SQL: ${updateAssetSql}, 参数: ${updateAssetParams}"))
      _ <- writeDB(updateAssetSql, updateAssetParams)
  
      // Step 4: Create transaction record
      transactionType <- IO {
        if (changeAmount > 0) "充值" else "消费"
      }
      changeReason <- IO {
        if (changeAmount > 0) "资产充值" else "资产消费"
      }
      _ <- createTransactionRecord(userID, transactionType, changeAmount, changeReason)
      _ <- IO(logger.info(s"[modifyAsset] 资产交易记录创建成功，用户ID=${userID}, 交易类型=${transactionType}, 数量=${changeAmount}"))
  
    } yield "资产数量更新成功!"
  }
}
