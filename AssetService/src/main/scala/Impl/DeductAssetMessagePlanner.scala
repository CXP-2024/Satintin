package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.AssetTransactionProcess.{fetchAssetStatus, createTransactionRecord}
import cats.effect.IO
import org.joda.time.DateTime
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.AdminService.UserActionLog
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
import Common.DBAPI._
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.ServiceUtils.schemaName
import Utils.AssetTransactionProcess.fetchAssetStatus
import Utils.AssetTransactionProcess.createTransactionRecord
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Utils.AssetTransactionProcess.createTransactionRecord

case class DeductAssetMessagePlanner(
  userToken: String,
  deductAmount: Int,
  override val planContext: PlanContext
) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate user token and parse user ID
      _ <- IO(logger.info(s"[DeductAssetMessagePlanner] 验证用户令牌"))
      userID <- validateUserToken(userToken)

      // Step 2: Check user asset status
      _ <- IO(logger.info(s"[DeductAssetMessagePlanner] 检查用户资产是否足够"))
      _ <- checkAssetSufficiency(userID, deductAmount)

      // Step 3: Deduct asset and record transaction
      _ <- IO(logger.info(s"[DeductAssetMessagePlanner] 执行扣减操作并记录交易信息"))
      result <- executeDeductionAndRecord(userID, deductAmount)

      // Step 4: Return success message
      _ <- IO(logger.info(s"[DeductAssetMessagePlanner] 返回操作结果"))
    } yield result
  }

  private def validateUserToken(userToken: String)(using PlanContext): IO[String] = {
    for {
      // Step 1.1: Validate token
      _ <- IO {
        if (userToken.isBlank) 
          throw new IllegalArgumentException("用户令牌不能为空")
      }
      _ <- IO(logger.info(s"[validateUserToken] 验证用户令牌成功"))

      // Step 1.2: Parse and check expiration
      userID <- IO {
        val parsedUserID = parseUserIDFromToken(userToken)
        if (parsedUserID.isEmpty)
          throw new IllegalArgumentException("用户令牌无效或过期")
        parsedUserID
      }
      _ <- IO(logger.info(s"[validateUserToken] 解析用户令牌，userID=${userID}"))
    } yield userID
  }

  private def parseUserIDFromToken(userToken: String): String = {
    // For AssetService, we treat the userToken as the userID directly
    userToken
  }

  private def checkAssetSufficiency(userID: String, deductAmount: Int)(using PlanContext): IO[Unit] = {
    for {
      // Fetch the current asset status from the database
      currentAsset <- fetchAssetStatus(userID)
      _ <- IO {
        if (currentAsset < deductAmount) 
          throw new IllegalStateException(s"用户资产不足，当前资产: ${currentAsset}, 请求扣减: ${deductAmount}")
      }
      _ <- IO(logger.info(s"[checkAssetSufficiency] 用户资产检查通过，当前资产: ${currentAsset}, 扣减金额: ${deductAmount}"))
    } yield ()
  }

  private def executeDeductionAndRecord(userID: String, deductAmount: Int)(using PlanContext): IO[String] = {
    for {
      // Execute deduction and record transaction in one go
      _ <- IO(logger.info(s"[executeDeductionAndRecord] 扣减用户资产并记录交易，用户ID=${userID}, 扣减金额=${deductAmount}"))
      result <- createTransactionRecord(userID, "PURCHASE", -deductAmount, "资产扣减")
      _ <- IO(logger.info(s"[executeDeductionAndRecord] 资产扣减和记录成功，结果=${result}"))
    } yield "资产扣减成功！"
  }
}