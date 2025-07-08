package Impl

import Common.API.{API, PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.CardService.CardEntry
import Utils.CardInventoryUtils.fetchUserCardInventory
import cats.effect.IO
import cats.implicits.*
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import org.slf4j.LoggerFactory

case class GetPlayerCardsMessage(
  userID: String
) extends API[List[CardEntry]]("GetPlayerCardsService")

case class GetPlayerCardsMessagePlanner(
  userID: String,
  override val planContext: PlanContext
) extends Planner[List[CardEntry]] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[List[CardEntry]] = {
    for {
      // Step 1: Validate user token
      _ <- IO(logger.info(s"[Step 1] 验证用户Token合法性: userID=${userID}"))
      // validation to be completed

      // Step 2: Use token directly as user ID (consistent with other services)
      _ <- IO(logger.info(s"[Step 2.1] 用户ID: ${userID}"))

      // Step 3: Fetch user card inventory
      _ <- IO(logger.info(s"[Step 3] 开始拉取用户卡牌信息: userID=${userID}"))
      cardEntries <- fetchUserCardInventory(userID)
      _ <- IO(logger.info(s"[Step 3.1] 成功拉取用户卡牌信息: 共 ${cardEntries.size} 条记录"))
    } yield cardEntries
  }
}