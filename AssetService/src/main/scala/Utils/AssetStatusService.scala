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
 * 资产状态服务
 * 负责处理用户资产状态的查询、创建和修改
 */
case object AssetStatusService {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 获取用户的资产状态（原石数量）
   */
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

  /**
   * 为用户创建初始资产记录
   */
  def createInitialAssetRecord(userID: String)(using PlanContext): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"[createInitialAssetRecord] 为用户 ${userID} 创建初始资产记录"))
      currentTime <- IO(DateTime.now())
      insertSQL <- IO {
        s"""
        INSERT INTO ${schemaName}.user_asset_status_table 
        (user_id, stone_amount, standard_card_draw_count, featured_card_draw_count, last_updated)
        VALUES (?, ?, ?, ?, ?)
        """
      }
      insertParams <- IO {
        List(
          SqlParameter("String", userID),
          SqlParameter("Int", "0"),  // Initial stone amount is 0
          SqlParameter("Int", "0"),  // Initial standard pool draw count is 0
          SqlParameter("Int", "0"),  // Initial featured pool draw count is 0
          SqlParameter("DateTime", currentTime.getMillis.toString)
        )
      }
      _ <- IO(logger.info(s"[createInitialAssetRecord] 执行SQL: ${insertSQL}, 参数: ${insertParams}"))
      _ <- writeDB(insertSQL, insertParams)
      _ <- IO(logger.info(s"[createInitialAssetRecord] 初始资产记录创建成功，用户: ${userID}，初始原石数量: 0，初始标准池抽卡次数: 0，初始限定池抽卡次数: 0"))
    } yield ()
  }

  /**
   * 修改用户资产数量
   */
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
