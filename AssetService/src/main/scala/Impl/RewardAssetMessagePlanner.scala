package Impl


/**
 * RewardAssetMessagePlanner
 *
 * Planner for RewardAssetMessage: Increases user assets and logs related transactions.
 *
 * @param userToken User's token
 * @param rewardAmount Reward amount
 * @param planContext PlanContext
 */
import APIs.UserService.GetUserInfoMessage
import Utils.AssetTransactionProcess.{modifyAsset, createTransactionRecord}
import Common.API.{PlanContext, Planner}
import org.slf4j.LoggerFactory
import cats.effect.IO
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits._
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Common.ServiceUtils.schemaName
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
import Objects.AdminService.UserActionLog
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import Objects.UserService.MessageEntry
import Objects.UserService.User
import Utils.AssetTransactionProcess.fetchAssetStatus
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Utils.AssetTransactionProcess.fetchAssetStatus

case class RewardAssetMessagePlanner(
                                      userToken: String,
                                      rewardAmount: Int,
                                      override val planContext: PlanContext
                                    ) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  /**
   * Main execution plan.
   *
   * @return IO[String]
   */  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info("开始执行 RewardAssetMessagePlanner"))

      // Step 1: Verify user identity
      userID <- verifyUserToken(userToken)

      // Step 2: Modify asset first
      _ <- IO(logger.info(s"[RewardAssetMessagePlanner] 增加用户资产，用户ID=${userID}, 奖励金额=${rewardAmount}"))
      _ <- modifyAsset(userID, rewardAmount)
      _ <- IO(logger.info(s"[RewardAssetMessagePlanner] 资产增加成功"))

      // Step 3: Create transaction record for logging
      _ <- IO(logger.info(s"[RewardAssetMessagePlanner] 记录交易日志"))
      transactionID <- createTransactionRecord(userID, "REWARD", rewardAmount, "REWARD发放")
      _ <- IO(logger.info(s"[RewardAssetMessagePlanner] 交易记录成功，交易ID=${transactionID}"))

      // Step 4: Return result
      _ <- IO(logger.info("REWARD发放成功"))
    } yield "REWARD发放成功"
  }

  /**
   * Step 1.1: Verifies user identity using the provided token.
   * For AssetService, we treat the userToken as the userID directly.
   *
   * @param token User's token
   * @return IO[String] containing userID
   */
  private def verifyUserToken(token: String)(using PlanContext): IO[String] = {
    for {
      _ <- IO(if (token == null || token.trim.isEmpty) 
                throw new IllegalArgumentException("用户 token 不能为空或无效"))
      _ <- IO(logger.info(s"解析并校验用户 token=$token"))

      // For AssetService, we treat the userToken as the userID directly
      userID <- IO.pure(token)
      _ <- IO(logger.info(s"用户 token 验证成功，对应用户 ID=${userID}"))

    } yield userID
  }
}