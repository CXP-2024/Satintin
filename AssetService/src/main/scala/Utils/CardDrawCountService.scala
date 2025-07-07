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
 * 抽卡次数服务
 * 负责处理用户抽卡次数的查询和更新
 */
case object CardDrawCountService {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 更新用户在指定卡池的抽卡次数
   */
  def updateCardDrawCount(userID: String, poolType: String, drawCount: Int)(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate input parameters
      _ <- IO {
        if (userID == null || userID.trim.isEmpty)
          throw new IllegalArgumentException("用户ID不能为空或无效")
        if (!Set("standard", "featured").contains(poolType))
          throw new IllegalArgumentException(s"池类型不支持: ${poolType}，只支持 'standard' 或 'featured'")
        if (drawCount < 0)
          throw new IllegalArgumentException("设定抽卡次数不能小于0")
      }
      _ <- IO(logger.info(s"[updateCardDrawCount] 输入参数验证成功，userID=${userID}, poolType=${poolType}, drawCount=${drawCount}"))

      // Step 2: Set card draw count in user_asset_status_table
      updateDrawCountSql <- IO {
        val columnName = if (poolType == "standard") "standard_card_draw_count" else "featured_card_draw_count"
        s"""
        UPDATE ${schemaName}.user_asset_status_table
        SET ${columnName} = ?, last_updated = ?
        WHERE user_id = ?
        """
      }
      updateDrawCountParams <- IO {
        List(
          SqlParameter("Int", drawCount.toString),
          SqlParameter("DateTime", DateTime.now().getMillis.toString),
          SqlParameter("String", userID)
        )
      }
      _ <- IO(logger.info(s"[updateCardDrawCount] 正在设置用户${poolType}池抽卡次数，SQL: ${updateDrawCountSql}, 参数: ${updateDrawCountParams}"))
      _ <- writeDB(updateDrawCountSql, updateDrawCountParams)
      _ <- IO(logger.info(s"[updateCardDrawCount] ${poolType}池抽卡次数设置成功，用户ID=${userID}, 抽卡次数=${drawCount}"))

    } yield s"${poolType}池抽卡次数更新成功!"
  }

  /**
   * 获取用户在指定卡池的抽卡次数
   */
  def fetchCardDrawCount(userID: String, poolType: String)(using PlanContext): IO[Int] = {
    for {
      // Step 1: Validate input parameter
      _ <- IO {
        if (userID == null || userID.trim.isEmpty)
          throw new IllegalArgumentException("用户ID不能为空或无效")
        if (!Set("standard", "featured").contains(poolType))
          throw new IllegalArgumentException(s"池类型不支持: ${poolType}，只支持 'standard' 或 'featured'")
      }
      _ <- IO(logger.info(s"[fetchCardDrawCount] 开始查询用户${poolType}池抽卡次数，userID='${userID}'"))

      // Step 2: Query card draw count from database
      querySQL <- IO {
        val columnName = if (poolType == "standard") "standard_card_draw_count" else "featured_card_draw_count"
        s"SELECT ${columnName} FROM ${schemaName}.user_asset_status_table WHERE user_id = ?"
      }
      parameters <- IO(List(SqlParameter("String", userID)))
      _ <- IO(logger.info(s"[fetchCardDrawCount] 查询SQL: ${querySQL}，参数: ${parameters}"))

      // Step 3: Execute query and handle result
      result <- readDBJsonOptional(querySQL, parameters).flatMap {
        case Some(json) =>
          val columnName = if (poolType == "standard") "standard_card_draw_count" else "featured_card_draw_count"
          val drawCount = decodeField[Int](json, columnName)
          IO {
            logger.info(s"[fetchCardDrawCount] 查询成功，用户${poolType}池抽卡次数为: ${drawCount}")
          } >> IO.pure(drawCount)
        case None =>
          // User doesn't have an asset record yet, create one with 0 draw count
          IO(logger.info(s"[fetchCardDrawCount] 用户 ${userID} 暂无资产记录，创建默认记录")) >>
          AssetStatusService.createInitialAssetRecord(userID).flatMap { _ =>
            IO {
              logger.info(s"[fetchCardDrawCount] 创建初始资产记录成功，返回默认${poolType}池抽卡次数: 0")
            } >> IO.pure(0)
          }
      }
    } yield result
  }
}
