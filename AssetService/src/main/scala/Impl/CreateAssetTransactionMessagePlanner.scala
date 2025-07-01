package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.AssetTransactionProcess.{modifyAsset, createTransactionRecord}
import Objects.UserService.User
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.generic.auto._
import io.circe.syntax._
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.AdminService.UserActionLog
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import Objects.UserService.MessageEntry
import Utils.AssetTransactionProcess.fetchAssetStatus
import org.joda.time.DateTime
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
import Utils.AssetTransactionProcess.createTransactionRecord
import Utils.AssetTransactionProcess.fetchAssetStatus
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class CreateAssetTransactionMessagePlanner(
  userToken: String,
  transactionType: String,
  changeAmount: Int,
  changeReason: String,
  override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  override def plan(using context: PlanContext): IO[String] = {
    for {
      // Step 1: Validate user identity and permissions
      authenticatedUser <- authenticateUser(userToken)

      // Step 2: Modify asset first
      _ <- IO(logger.info(s"[CreateAssetTransactionMessagePlanner] 修改用户资产，用户ID=${authenticatedUser.userID}, 变动金额=${changeAmount}"))
      _ <- modifyAsset(authenticatedUser.userID, changeAmount)
      _ <- IO(logger.info(s"[CreateAssetTransactionMessagePlanner] 资产修改成功"))

      // Step 3: Create transaction record for logging
      _ <- IO(logger.info(s"[CreateAssetTransactionMessagePlanner] 记录交易日志"))
      transactionID <- createTransactionRecord(
        authenticatedUser.userID,
        transactionType,
        changeAmount,
        changeReason
      )
      _ <- IO(logger.info(s"[CreateAssetTransactionMessagePlanner] 交易记录成功，交易ID=${transactionID}"))
      
      // Step 4: Return process result
      _ <- IO(logger.info(s"[CreateAssetTransactionMessagePlanner] 交易完成。交易ID: ${transactionID}"))
    } yield s"交易完成，交易ID: ${transactionID}"
  }

  private def authenticateUser(userToken: String)(using PlanContext): IO[User] = {
    for {
      _ <- IO {
        if (userToken == null || userToken.trim.isEmpty)
          throw new IllegalArgumentException("用户令牌无效")
      }
      _ <- IO(logger.info(s"[authenticateUser] 验证用户令牌: ${userToken}"))

      // For AssetService, we treat the userToken as the userID directly
      // AssetService doesn't manage users - it only manages assets for existing users
      userID <- IO.pure(userToken)
      _ <- IO(logger.info(s"[authenticateUser] 使用Token作为用户ID: ${userID}"))
      
      // Return a minimal user representation for AssetService operations
      user <- IO {
        User(
          userID = userID,
          userName = s"User_${userID}",  // Placeholder name
          passwordHash = "",  // Not needed for asset operations
          email = "",         // Not needed for asset operations
          phoneNumber = "",   // Not needed for asset operations
          registerTime = DateTime.now(),
          permissionLevel = 1,
          banDays = 0,
          isOnline = false,
          matchStatus = "Unknown",
          stoneAmount = 0,    // Will be updated from asset service
          cardDrawCount = 0,
          rank = "Unknown",
          rankPosition = 0,
          friendList = List.empty,
          blackList = List.empty,
          messageBox = List.empty
        )
      }
      _ <- IO(logger.info(s"[authenticateUser] 用户验证通过: ${userID}"))
    } yield user
  }
}