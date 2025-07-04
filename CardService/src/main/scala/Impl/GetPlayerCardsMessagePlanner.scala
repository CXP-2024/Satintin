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
      // validation to be completed

      // Step 2: Use token directly as user ID (consistent with other services)
      _ <- IO(logger.info(s"[Step 2] 使用Token作为用户ID: userToken=${userToken}"))
      userID = userToken  // 直接使用 token 作为 userID，与其他服务保持一致
      _ <- IO(logger.info(s"[Step 2.1] 用户ID: ${userID}"))

      // Step 3: Fetch user card inventory
      _ <- IO(logger.info(s"[Step 3] 开始拉取用户卡牌信息: userID=${userID}"))
      cardEntries <- fetchUserCardInventory(userID)
      _ <- IO(logger.info(s"[Step 3.1] 成功拉取用户卡牌信息: 共 ${cardEntries.size} 条记录"))
    } yield cardEntries
  }
}