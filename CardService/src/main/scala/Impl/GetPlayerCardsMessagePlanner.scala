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
      cardEntries <- fetchUserCardInventory(userID)
      _ <- IO(logger.info(s"[Step 3.1] 成功拉取用户卡牌信息: 共 ${cardEntries.size} 条记录"))
    } yield cardEntries
  }
}