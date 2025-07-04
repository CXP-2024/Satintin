package Utils

import Common.API.PlanContext
import Common.DBAPI._
import Common.Object.SqlParameter
import cats.effect.IO
import org.slf4j.LoggerFactory
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import org.joda.time.DateTime

case object AssetModificationProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 修改用户资产
   */
  def modifyUserAsset(userID: String, changeAmount: Int)(using PlanContext): IO[String] = {
    for {
      _ <- IO {
        if (userID == null || userID.trim.isEmpty)
          throw new IllegalArgumentException("用户ID不能为空或无效")
        if (changeAmount == 0)
          throw new IllegalArgumentException("变动金额不能为0")
      }
      _ <- IO(logger.info(s"[modifyUserAsset] 输入参数验证成功，userID=${userID}, changeAmount=${changeAmount}"))
  
      // 需要导入AssetQueryProcess来获取当前资产
      currentAsset <- AssetQueryProcess.fetchUserAssetStatus(userID)
      _ <- IO(logger.info(s"[modifyUserAsset] 当前用户资产数量：${currentAsset}"))
  
      newAssetAmount <- IO {
        val updatedAmount = currentAsset + changeAmount
        if (updatedAmount < 0)
          throw new IllegalStateException(s"用户资产不足，当前资产: ${currentAsset}, 请求变动: ${changeAmount}")
        updatedAmount
      }
      _ <- IO(logger.info(s"[modifyUserAsset] 新资产数量计算成功，新资产数量为：${newAssetAmount}"))
  
      // 如果用户没有资产记录，先创建
      _ <- createAssetRecordIfNotExists(userID)
  
      updateAssetSql <- IO {
        s"""
        UPDATE assetservice.user_asset_status_table
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
      _ <- IO(logger.info(s"[modifyUserAsset] 正在更新用户资产，SQL: ${updateAssetSql}, 参数: ${updateAssetParams}"))
      _ <- writeDB(updateAssetSql, updateAssetParams)
      _ <- IO(logger.info(s"[modifyUserAsset] 资产更新成功，用户ID=${userID}, 新资产数量=${newAssetAmount}"))    
    } yield "资产数量更新成功!"
  }
  
  /**
   * 如果用户没有资产记录则创建
   */
  private def createAssetRecordIfNotExists(userID: String)(using PlanContext): IO[Unit] = {
    for {
      // 检查是否已存在
      assetOpt <- readDBJsonOptional(
        s"SELECT user_id FROM assetservice.user_asset_status_table WHERE user_id = ?",
        List(SqlParameter("String", userID))
      )
      
      _ <- assetOpt match {
        case Some(_) =>
          IO(logger.info(s"[createAssetRecordIfNotExists] 用户 ${userID} 已有资产记录"))
        case None =>
          for {
            _ <- IO(logger.info(s"[createAssetRecordIfNotExists] 为用户 ${userID} 创建初始资产记录"))
            currentTime <- IO(DateTime.now())
            insertSQL <- IO {
              s"""
              INSERT INTO assetservice.user_asset_status_table 
              (user_id, stone_amount, standard_card_draw_count, featured_card_draw_count, last_updated)
              VALUES (?, ?, ?, ?, ?)
              """
            }
            insertParams <- IO {
              List(
                SqlParameter("String", userID),
                SqlParameter("Int", "0"),
                SqlParameter("Int", "0"),
                SqlParameter("Int", "0"),
                SqlParameter("DateTime", currentTime.getMillis.toString)
              )
            }
            _ <- IO(logger.info(s"[createAssetRecordIfNotExists] 执行SQL: ${insertSQL}, 参数: ${insertParams}"))
            _ <- writeDB(insertSQL, insertParams)
            _ <- IO(logger.info(s"[createAssetRecordIfNotExists] 初始资产记录创建成功，用户: ${userID}"))
          } yield ()
      }
    } yield ()
  }
}