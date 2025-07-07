package Utils

import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import cats.implicits._
import Common.API.PlanContext
import cats.effect.IO
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import APIs.AssetService.{QueryAssetStatusMessage, DeductAssetMessage}
import APIs.UserService.{ValidateUserTokenMessage, LogUserOperationMessage}
import Utils.CardInventoryUtils.fetchUserCardInventory

case object CardUpgradeUtils {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 升级卡牌
   * @param userToken 用户令牌
   * @param userID 用户ID
   * @param cardID 卡牌ID
   * @return 升级结果消息
   */
  def upgradeCard(userToken: String, userID: String, cardID: String)(using PlanContext): IO[String] = {    
    for {
      // Step 1.1: Verify userToken and check if returned userID matches the provided userID
      _ <- IO(logger.info(s"调用 UserService 验证用户 Token 并检查用户ID: ${userID}"))
      tokenUserID <- ValidateUserTokenMessage(userToken).send
      _ <- if (tokenUserID != userID) {
             IO.raiseError(new IllegalStateException(s"Token验证失败：Token对应的用户ID ${tokenUserID} 与提供的用户ID ${userID} 不匹配"))
           } else {
             IO(logger.info(s"Token验证成功，用户ID匹配: ${userID}"))
           }

      // Step 1.2: Verify cardID belongs to the user
      _ <- IO(logger.info(s"验证卡片ID: ${cardID}是否属于用户 ${userID}"))
      cardExists <- readDBBoolean(
        s"SELECT EXISTS(SELECT 1 FROM ${schemaName}.user_card_table WHERE user_id = ? AND card_id = ?);",
        List(SqlParameter("String", userID), SqlParameter("String", cardID))
      )
      _ <- if (!cardExists) {
             IO.raiseError(new IllegalStateException(s"卡片ID ${cardID}不存在或者不属于用户 ${userID}"))
           } else {
             IO(logger.info(s"卡片ID ${cardID}属于用户 ${userID}"))
           }

      // Step 2.1: Fetch user's card inventory and find the card
      _ <- IO(logger.info(s"获取用户 ${userID} 的卡片库存"))
      userCards <- fetchUserCardInventory(userID)
      card <- IO.fromOption(userCards.find(_.cardID == cardID))(
        new IllegalStateException(s"无法在用户卡片列表中找到卡片ID ${cardID}")
      )
      currentLevel = card.cardLevel
      _ <- IO(logger.info(s"卡片 ${cardID} 当前等级为 ${currentLevel}"))

      // Step 2.2: Verify if user has enough resources for the upgrade
      _ <- IO(logger.info(s"验证用户是否有足够的资源进行升级"))
      _ <- IO(logger.info(s"调用 AssetService 查询用户原石数量"))
      currentStoneAmount <- QueryAssetStatusMessage(userToken).send
      upgradeCost = (currentLevel + 1) * 10 // 假设升级消耗为 (当前等级 + 1) * 10
      _ <- IO(logger.info(s"用户当前拥有的原石数量: ${currentStoneAmount}, 升级需要消耗的数量: ${upgradeCost}"))
      _ <- if (currentStoneAmount < upgradeCost) {
             IO.raiseError(new IllegalStateException(s"资源不足：用户当前原石数量 ${currentStoneAmount}, 需要 ${upgradeCost}"))
           } else {
             IO(logger.info(s"资源足够进行升级"))
           }

      // Step 3.1: Deduct user's resources
      _ <- IO(logger.info(s"扣减用户的资源"))
      _ <- IO(logger.info(s"调用 AssetService 扣减用户资源，数量: ${upgradeCost}"))
      _ <- DeductAssetMessage(userToken, upgradeCost).send
      _ <- IO(logger.info(s"成功扣减资源，扣除数量: ${upgradeCost}"))

      // Step 4.1: Update card's level in the database
      _ <- IO(logger.info(s"更新卡片等级"))
      _ <- writeDB(
        s"UPDATE ${schemaName}.user_card_table SET card_level = card_level + 1 WHERE user_id = ? AND card_id = ?;",
        List(
          SqlParameter("String", userID),
          SqlParameter("String", cardID)
        )
      )
      _ <- IO(logger.info(s"成功将卡片ID ${cardID} 的等级更新为 ${currentLevel + 1}"))

      // Step 5.1: Log the upgrade operation
      _ <- IO(logger.info(s"记录本次升级操作"))
      _ <- LogUserOperationMessage(
             userToken,  // 使用 userToken 而不是 userID
             "upgrade_card",
             s"from level ${currentLevel} to level ${currentLevel + 1}"
           ).send
      _ <- IO(logger.info(s"升级操作记录成功"))

      _ <- LogUserOperationMessage(
            userToken,  // 使用 userToken 而不是 userID
            "upgrade_card",
            s"cost=$upgradeCost"
          ).send
    } yield "卡牌已成功升级!"
  }
}
