package Impl


import Utils.AssetTransactionProcess.fetchAssetStatus
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
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
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class QueryAssetStatusMessagePlanner(
                                           userToken: String,
                                           override val planContext: PlanContext
                                         ) extends Planner[Int] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[Int] = {
    for {
      // Step 1: Validate user token and fetch user ID
      _ <- IO(logger.info(s"[plan] 开始验证用户Token的合法性: ${userToken}"))
      userID <- validateAndDecodeToken(userToken)

      // Step 2: Fetch and validate user's stone amount
      _ <- IO(logger.info(s"[plan] 验证通过，用户ID为: ${userID}，开始查询用户的资产状态"))
      stoneAmount <- fetchUserStoneAmount(userID)

      // Step 3: Return the stone amount
      _ <- IO(logger.info(s"[plan] 用户当前的原石数量为: ${stoneAmount}"))
    } yield stoneAmount
  }

  private def validateAndDecodeToken(token: String)(using PlanContext): IO[String] = {
    if (token == null || token.trim.isEmpty) {
      IO(logger.error(s"[validateAndDecodeToken] Token为空或者无效: ${token}")) >>
      IO.raiseError(new IllegalArgumentException("用户Token不能为空或无效"))
    } else {
      for {
        // Step 1: Query User table by user token to get userID
        _ <- IO(logger.info(s"[validateAndDecodeToken] 开始验证Token: ${token}"))
        userQuerySQL <- IO(s"SELECT user_id FROM ${schemaName}.user WHERE user_token = ?")
        userQueryParams <- IO(List(SqlParameter("String", token)))
        userJson <- readDBJsonOptional(userQuerySQL, userQueryParams).flatMap {
          case Some(json) => IO.pure(json)
          case None =>
            IO(logger.error(s"[validateAndDecodeToken] 未找到与令牌关联的用户: ${token}")) >>
            IO.raiseError(new IllegalArgumentException("用户Token无效或不存在"))
        }
        userID <- IO(decodeField[String](userJson, "user_id"))
        _ <- IO(logger.info(s"[validateAndDecodeToken] Token 验证成功，解析得到的用户ID: ${userID}"))
      } yield userID
    }
  }

  private def fetchUserStoneAmount(userID: String)(using PlanContext): IO[Int] = {
    for {
      assetStatus <- fetchAssetStatus(userID)
      stoneAmount <- IO {
        if (assetStatus < 0) {
          logger.error(s"[fetchUserStoneAmount] 用户 ${userID} 原石信息不合法：${assetStatus}")
          throw new IllegalStateException(s"用户 ${userID} 原石信息不合法：${assetStatus}")
        } else assetStatus
      }
      _ <- IO(logger.info(s"[fetchUserStoneAmount] 用户 ${userID} 的原石数量为: ${stoneAmount}"))
    } yield stoneAmount
  }

}