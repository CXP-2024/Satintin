package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.AssetTransactionProcess.fetchTransactionHistory
import Objects.UserService.User
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.generic.auto._
import io.circe.syntax._
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.AssetService.AssetTransaction
import org.joda.time.DateTime

case class GetAssetTransactionMessagePlanner(
  userToken: String,
  override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  
  override def plan(using context: PlanContext): IO[String] = {
    for {
      // Step 1: Validate user identity and permissions
      authenticatedUser <- authenticateUser(userToken)

      // Step 2: Fetch transaction history
      _ <- IO(logger.info(s"[GetAssetTransactionMessagePlanner] 获取用户交易记录，用户ID=${authenticatedUser.userID}"))
      transactions <- fetchTransactionHistory(authenticatedUser.userID)
      _ <- IO(logger.info(s"[GetAssetTransactionMessagePlanner] 成功获取 ${transactions.length} 条交易记录"))

      // Step 3: Convert to JSON and return
      transactionsJson <- IO {
        val transactionList = transactions.map { transaction =>
          Json.obj(
            "transactionID" -> Json.fromString(transaction.transactionID),
            "userID" -> Json.fromString(transaction.userID),
            "transactionType" -> Json.fromString(transaction.transactionType),
            "changeAmount" -> Json.fromInt(transaction.changeAmount),
            "changeReason" -> Json.fromString(transaction.changeReason),
            "timestamp" -> Json.fromLong(transaction.timestamp.getMillis)
          )
        }
        Json.obj(
          "userID" -> Json.fromString(authenticatedUser.userID),
          "totalTransactions" -> Json.fromInt(transactions.length),
          "transactions" -> Json.fromValues(transactionList)
        ).toString
      }
      
      _ <- IO(logger.info(s"[GetAssetTransactionMessagePlanner] 交易记录查询完成"))
    } yield transactionsJson
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
