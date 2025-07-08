package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.UserService.{User, MessageEntry, BlackEntry, FriendEntry}
import Objects.CardService.CardEntry
import APIs.AssetService.{QueryAssetStatusMessage, DeductAssetMessage}
import Utils.CardInventoryUtils.fetchUserCardInventory
import Utils.CardUpgradeUtils.upgradeCard
import cats.effect.IO
import cats.implicits.*
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import org.slf4j.LoggerFactory
import APIs.AssetService.DeductAssetMessage
import APIs.UserService.GetUserInfoMessage

case class UpgradeCardMessagePlanner(
  userID: String,
  cardID: String,
  override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Verify userID validity
      _ <- IO(logger.info("验证用户身份令牌的合法性"))
      // validation to be completed

      // Step 2: Check if user owns the card
      _ <- IO(logger.info(s"检查用户 ${userID} 是否拥有卡片 ${cardID}"))
      isCardOwned <- checkUserOwnsCard(userID, cardID)
      _ <- if (!isCardOwned) {
        IO.raiseError(new IllegalStateException(s"用户 ${userID} 未拥有卡片 ${cardID}"))
      } else {
        IO(logger.info(s"用户 ${userID} 拥有卡片 ${cardID}"))
      }

      // Step 3: Verify user has sufficient resources
      _ <- IO(logger.info("验证用户是否拥有足够的升级资源"))
      currentStoneAmount <- QueryAssetStatusMessage(userID).send
      upgradeCost <- calculateUpgradeCost(userID, cardID)
      _ <- if (currentStoneAmount < upgradeCost) {
        IO.raiseError(new IllegalStateException(s"资源不足: 当前原石数量 ${currentStoneAmount}, 升级需要 ${upgradeCost}"))
      } else {
        IO(logger.info(s"资源充足: 当前原石数量 ${currentStoneAmount}, 升级需要 ${upgradeCost}"))
      }

      // Step 4: Deduct upgrade resources
      _ <- IO(logger.info(s"扣减用户的升级资源，数量: ${upgradeCost}"))
      _ <- DeductAssetMessage(userID, upgradeCost).send

      // Step 5: Upgrade the card
      _ <- IO(logger.info(s"执行卡片升级逻辑，升级卡片 ${cardID}"))
      _ <- upgradeCard(userID, userID, cardID)

      // Step 6: Return success result
      result <- IO.pure("卡牌升级成功！")
      _ <- IO(logger.info(result))
    } yield result
  }

  // Step 2.1: Check if user owns the specified card
  private def checkUserOwnsCard(userID: String, cardID: String)(using PlanContext): IO[Boolean] = {
    for {
      _ <- IO(logger.info(s"检查用户 ${userID} 是否拥有卡片 ${cardID}"))
      isOwned <- readDBBoolean(
        s"SELECT EXISTS(SELECT 1 FROM ${schemaName}.user_card_table WHERE user_id = ? AND card_id = ?);",
        List(SqlParameter("String", userID), SqlParameter("String", cardID))
      )
      _ <- IO(logger.info(s"用户是否拥有卡片：${isOwned}"))
    } yield isOwned
  }

  // Step 3.2: Calculate upgrade cost
  private def calculateUpgradeCost(userID: String, cardID: String)(using PlanContext): IO[Int] = {
    for {
      _ <- IO(logger.info(s"计算卡片 ${cardID} 的升级所需资源"))
      userCards <- fetchUserCardInventory(userID)
      card <- IO.fromOption(userCards.find(_.cardID == cardID))(
        new IllegalStateException(s"无法在用户卡片列表中找到卡片 ${cardID}")
      )
      upgradeCost = (card.cardLevel + 1) * 10 // 假设升级消耗为 (当前等级 + 1) * 10
      _ <- IO(logger.info(s"卡片当前等级为 ${card.cardLevel}, 升级需要资源为 ${upgradeCost}"))
    } yield upgradeCost
  }
}