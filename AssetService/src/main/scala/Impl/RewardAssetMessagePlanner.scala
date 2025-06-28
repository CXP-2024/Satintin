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

      // Step 2: Create transaction record and update asset in one go
      result <- createTransactionRecord(userID, "REWARD", rewardAmount, "REWARD发放")

      // Step 3: Return result
      _ <- IO(logger.info("REWARD发放成功"))
    } yield result
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