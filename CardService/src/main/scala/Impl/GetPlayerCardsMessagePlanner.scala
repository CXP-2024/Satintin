package Impl

import Common.API.API
import Objects.CardService.CardEntry
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.CardManagementProcess.fetchUserCardInventory
import cats.effect.IO
import org.slf4j.LoggerFactory
import cats.implicits._
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
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
import Utils.CardManagementProcess.fetchUserCardInventory
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class GetPlayerCardsMessage(
  userToken: String
) extends API[List[CardEntry]]("GetPlayerCardsService")

case class GetPlayerCardsMessagePlanner(
  userToken: String,
  override val planContext: PlanContext
) extends Planner[List[CardEntry]] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[List[CardEntry]] = {
    for {
      // Step 1: Validate user token
      _ <- IO(logger.info(s"[Step 1] 验证用户Token合法性: userToken=${userToken}"))
      isTokenValid <- validateUserToken(userToken)
      _ <- if (!isTokenValid) {
        IO(logger.error("[Step 1.1] 用户Token无效或已过期"))
          >> IO.raiseError(new IllegalArgumentException("用户Token无效或已过期"))
      } else IO(logger.info("[Step 1.2] 用户Token验证通过"))

      // Step 2: Parse token to get user ID
      _ <- IO(logger.info(s"[Step 2] 解析Token以获取用户ID: userToken=${userToken}"))
      userID <- parseUserToken(userToken)
      _ <- IO(logger.info(s"[Step 2.1] 从Token解析出的用户ID: ${userID}"))

      // Step 3: Fetch user card inventory
      _ <- IO(logger.info(s"[Step 3] 开始拉取用户卡牌信息: userID=${userID}"))
      cardEntries <- fetchUserCardInventory(userID)
      _ <- IO(logger.info(s"[Step 3.1] 成功拉取用户卡牌信息: 共 ${cardEntries.size} 条记录"))
    } yield cardEntries
  }

  /**
   * Validates the user token authenticity.
   */
  private def validateUserToken(token: String)(using PlanContext): IO[Boolean] = {
    IO {
      logger.info("[validateUserToken] 开始验证用户Token")
      val isValid = token.nonEmpty && token.length > 10
      logger.info(s"[validateUserToken] 验证结果: ${isValid}")
      isValid
    }
  }

  /**
   * Extracts the user ID from the user token.
   */
  private def parseUserToken(token: String)(using PlanContext): IO[String] = {
    IO {
      logger.info("[parseUserToken] 开始解析用户Token")
      val userID = token.reverse // 示例解析逻辑
      logger.info(s"[parseUserToken] 解析后的用户ID: ${userID}")
      userID
    }
  }
}