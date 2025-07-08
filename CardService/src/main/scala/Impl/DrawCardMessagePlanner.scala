package Impl

import Common.API.{PlanContext, Planner}
import APIs.AssetService.{QueryAssetStatusMessage, DeductAssetMessage}
import APIs.UserService.GetUserInfoMessage
import Utils.CardInventoryUtils.fetchUserCardInventory
import Utils.CardDrawUtils.drawCards
import Objects.CardService.{DrawResult, CardEntry}
import org.slf4j.LoggerFactory
import java.util.UUID
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import Common.Object.{ParameterList, SqlParameter}
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import cats.effect.IO
import cats.implicits.*
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import io.circe.Json

case class DrawCardMessagePlanner(
  userID: String,
  drawCount: Int,
  poolType: String,
  override val planContext: PlanContext
) extends Planner[DrawResult] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[DrawResult] = {
    for {      // Step 1: Validate user token
      _ <- IO(logger.info("[Step 1] 验证用户Token合法性"))
      // validation to be completed

      // Step 1.5: Validate poolType
      _ <- IO(logger.info("[Step 1.5] 验证卡池类型"))
      _ <- if (!List("featured", "standard").contains(poolType)) {
        IO.raiseError(new IllegalArgumentException(s"卡池类型无效，必须是 featured 或 standard，当前值: ${poolType}"))
      } else IO(logger.info(s"卡池类型验证通过: ${poolType}"))

      // Step 2: Query user's asset status
      _ <- IO(logger.info("[Step 2] 检查用户资产原石数量"))
      stoneAmount <- QueryAssetStatusMessage(userID).send
      stoneCostPerDraw = 160
      totalCost = drawCount * stoneCostPerDraw
      _ <- if (stoneAmount < totalCost) {
        IO.raiseError(new IllegalStateException(s"原石数量不足: 当前=${stoneAmount}, 需要=${totalCost}"))      } else IO(logger.info(s"用户原石数量充足: 当前=${stoneAmount}, 消耗=${totalCost}"))
      
      // Step 4: Execute card draw (drawCards will handle asset deduction and transaction logging)
      _ <- IO(logger.info(s"[Step 4] 执行抽卡操作，数量=${drawCount}，卡池类型=${poolType}"))
      drawResult <- drawCards(userID, drawCount, poolType)

      _ <- IO(logger.info(s"抽卡完成，返回结果: $drawResult"))
    } yield drawResult
  }
}