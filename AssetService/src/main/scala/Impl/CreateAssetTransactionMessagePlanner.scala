package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.AssetTransactionProcess.{createTransactionRecord, modifyAsset}
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
import Utils.AssetTransactionProcess.modifyAsset
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

      // Step 2: Record asset transaction
      _ <- createTransactionRecord(
        authenticatedUser.userID,
        transactionType,
        changeAmount,
        changeReason
      )

      // Step 3: Update user asset status
      _ <- modifyAsset(authenticatedUser.userID, changeAmount)
      
      // Step 4: Return process result
      _ <- IO(logger.info(s"[Step 4] 交易完成。返回结果: 资产交易记录成功！"))
    } yield "资产交易记录成功！"
  }

  private def authenticateUser(userToken: String)(using PlanContext): IO[User] = {
    for {
      _ <- IO {
        if (userToken == null || userToken.trim.isEmpty)
          throw new IllegalArgumentException("用户令牌无效")
      }
      _ <- IO(logger.info(s"[authenticateUser] 验证用户令牌: ${userToken}"))

      // Step 1.1: Query User table by user token
      userQuerySQL <-
        IO(s"SELECT * FROM ${schemaName}.user WHERE user_token = ?")
      userQueryParams <- IO(List(SqlParameter("String", userToken)))
      userJson <- readDBJsonOptional(userQuerySQL, userQueryParams).flatMap {
        case Some(json) => IO.pure(json)
        case None =>
          IO.raiseError(new IllegalStateException(s"未找到与令牌关联的用户: ${userToken}"))
      }
      user <- IO(decodeType[User](userJson))
      _ <- IO(logger.info(s"[authenticateUser] 找到用户: {userID=${user.userID}, userName=${user.userName}}"))

      // Step 1.2: Ensure user account is active
      _ <- IO {
        if (user.banDays > 0 || user.email == null)
          throw new IllegalStateException("该用户账户状态异常或被封禁")
      }
      _ <- IO(logger.info(s"[authenticateUser] 用户账户状态校验通过"))
    } yield user
  }
}