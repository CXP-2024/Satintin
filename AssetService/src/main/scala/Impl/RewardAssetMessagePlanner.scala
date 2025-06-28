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
import Utils.AssetTransactionProcess.modifyAsset
import Utils.AssetTransactionProcess.createTransactionRecord
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
   */
  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info("开始执行 RewardAssetMessagePlanner"))

      // Step 1: Verify user identity
      userID <- verifyUserToken(userToken)

      // Step 2: Update user asset state
      _ <- updateUserAsset(userID, rewardAmount)

      // Step 3: Log transaction information
      _ <- logTransaction(userID, rewardAmount)

      // Step 4: Return result
      _ <- IO(logger.info("奖励发放成功"))
    } yield "奖励发放成功！"
  }

  /**
   * Step 1.1: Verifies user identity using the provided token.
   * Calls GetUserInfoMessage to extract userID.
   *
   * @param token User's token
   * @return IO[String] containing userID
   */
  private def verifyUserToken(token: String)(using PlanContext): IO[String] = {
    for {
      _ <- IO(if (token == null || token.trim.isEmpty) 
                throw new IllegalArgumentException("用户 token 不能为空或无效"))
      _ <- IO(logger.info(s"解析并校验用户 token=$token"))

      // Call GetUserInfoMessage to extract user details
      user <- GetUserInfoMessage(token, token).send
      _ <- IO(logger.info(s"用户 token 验证成功，对应用户 ID=${user.userID}"))

    } yield user.userID
  }

  /**
   * Step 2: Updates user's asset by calling modifyAsset.
   *
   * @param userID User's ID
   * @param rewardAmount Reward amount to add
   * @return IO[Unit]
   */
  private def updateUserAsset(userID: String, rewardAmount: Int)(using PlanContext): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"开始更新用户 $userID 的资产状态，奖励金额：$rewardAmount"))
      // Call modifyAsset to update asset
      _ <- modifyAsset(userID, rewardAmount)
      _ <- IO(logger.info(s"用户 $userID 的资产状态已更新"))
    } yield ()
  }

  /**
   * Step 3: Logs the transaction by calling createTransactionRecord.
   *
   * @param userID User's ID
   * @param rewardAmount Reward amount
   * @return IO[Unit]
   */
  private def logTransaction(userID: String, rewardAmount: Int)(using PlanContext): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"开始记录用户 $userID 的奖励交易信息"))
      // Call createTransactionRecord to log the transaction details
      _ <- createTransactionRecord(userID, "奖励", rewardAmount, "奖励发放")
      _ <- IO(logger.info(s"用户 $userID 的奖励交易信息已记录"))
    } yield ()
  }
}