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
import Common.Object.{ParameterList, SqlParameter}

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
        readDBJsonOptional(querySQL, parameters).flatMap {
          case Some(json) =>
            // User has an asset record, get the stone amount
            val assetStatus = decodeField[Int](json, "stone_amount")
            IO {
              logger.info(s"[fetchAssetStatus] 查询成功，用户原石数量为: ${assetStatus}")
            } >> IO.pure(assetStatus)
          case None =>
            // User doesn't have an asset record yet, create one with 0 stones
            IO(logger.info(s"[fetchAssetStatus] 用户 ${userID} 暂无资产记录，创建默认记录")) >>
            createInitialAssetRecord(userID).flatMap { _ =>
              IO {
                logger.info(s"[fetchAssetStatus] 创建初始资产记录成功，返回默认原石数量: 0")
              } >> IO.pure(0)
            }
        }
      }
    }
  }
  
  def createInitialAssetRecord(userID: String)(using PlanContext): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"[createInitialAssetRecord] 为用户 ${userID} 创建初始资产记录"))
      currentTime <- IO(DateTime.now())
      insertSQL <- IO {
        s"""
        INSERT INTO ${schemaName}.user_asset_status_table (user_id, stone_amount, last_updated)
        VALUES (?, ?, ?)
        """
      }
      insertParams <- IO {
        List(
          SqlParameter("String", userID),
          SqlParameter("Int", "0"),  // Initial stone amount is 0
          SqlParameter("DateTime", currentTime.getMillis.toString)
        )
      }
      _ <- IO(logger.info(s"[createInitialAssetRecord] 执行SQL: ${insertSQL}, 参数: ${insertParams}"))
      _ <- writeDB(insertSQL, insertParams)
      _ <- IO(logger.info(s"[createInitialAssetRecord] 初始资产记录创建成功，用户: ${userID}，初始原石数量: 0"))
    } yield ()
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
        if (!Set("CHARGE", "PURCHASE", "REWARD").contains(transactionType)) 
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
          SqlParameter("DateTime", timestamp.getMillis.toString)
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
  
      // Step 3.3: Update the asset status directly
      _ <- IO(logger.info(s"更新用户的资产数量，新的资产值：${newAssetAmount}"))
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
          SqlParameter("DateTime", timestamp.getMillis.toString),
          SqlParameter("String", userID)
        )
      }
      _ <- IO(logger.info(s"[createTransactionRecord] 正在更新用户资产，SQL: ${updateAssetSql}, 参数: ${updateAssetParams}"))
      _ <- writeDB(updateAssetSql, updateAssetParams)
  
      // Step 4: Final logging and return success message
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
          SqlParameter("DateTime", DateTime.now().getMillis.toString),
          SqlParameter("String", userID)
        )
      }
      _ <- IO(logger.info(s"[modifyAsset] 正在更新用户资产，SQL: ${updateAssetSql}, 参数: ${updateAssetParams}"))
      _ <- writeDB(updateAssetSql, updateAssetParams)
      _ <- IO(logger.info(s"[modifyAsset] 资产更新成功，用户ID=${userID}, 新资产数量=${newAssetAmount}"))

    } yield "资产数量更新成功!"
  }
}
