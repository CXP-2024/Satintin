package Impl


import Utils.CardManagementProcess.fetchUserCardInventory
import Objects.CardService.CardEntry
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import org.joda.time.DateTime
import io.circe.Json
import io.circe.syntax._
import cats.implicits.*
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
import Objects.CardService.CardEntry
import io.circe._
import io.circe.generic.auto._
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import APIs.UserService.GetUserInfoMessage

case class ConfigureBattleDeckMessagePlanner(
  userToken: String, 
  cardIDs: List[String],
  override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate user token
      _ <- IO(logger.info("[Step 1] 验证用户令牌状态"))
      // validation to be completed
      userID <- IO(userToken) 

      // Step 2: Validate cardIDs list length
      _ <- IO(logger.info("[Step 2] 检查cardIDs列表的长度"))
      _ <- validateCardIDsLength()

      // Step 3: Validate the legitimacy and ownership of card IDs
      _ <- IO(logger.info("[Step 3] 验证卡牌ID的合法性和所有权"))
      userOwnedCards <- fetchUserCardInventory(userID)
      _ <- validateCardOwnership(userOwnedCards)

      // Step 4: Update user's battle deck configuration
      _ <- IO(logger.info("[Step 4] 更新用户战斗卡组配置"))
      updateResult <- updateBattleDeck(userID)

      _ <- IO(logger.info("[Step 5] 战斗卡组配置完成"))
    } yield updateResult
  }

  // Function to validate the length of cardIDs list
  private def validateCardIDsLength()(using PlanContext): IO[Unit] = {
    if (cardIDs == null || cardIDs.isEmpty || cardIDs.size > 3) {
      IO.raiseError(new IllegalArgumentException("输入的卡牌ID数量必须是1到3张"))
    } else {
      IO(logger.info(s"cardIDs长度验证通过，长度为: ${cardIDs.size}"))
    }
  }

  // Function to validate if the card IDs belong to the user
  private def validateCardOwnership(userOwnedCards: List[CardEntry])(using PlanContext): IO[Unit] = {
    val userOwnedCardIDs = userOwnedCards.map(_.cardID).toSet
    val invalidCards = cardIDs.filterNot(userOwnedCardIDs.contains)

    if (invalidCards.nonEmpty) {
      IO.raiseError(new IllegalArgumentException(s"以下卡牌不属于用户：${invalidCards.mkString(", ")}"))
    } else {
      IO(logger.info("用户卡牌验证成功"))
    }
  }

  // Function to update the user's battle deck configuration
  private def updateBattleDeck(userID: String)(using PlanContext): IO[String] = {
    val sql =
      s"""
         INSERT INTO ${schemaName}.user_battle_deck_table (user_id, card_ids, configuration_time)
         VALUES (?, ?, ?)
         ON CONFLICT (user_id)
         DO UPDATE SET card_ids = EXCLUDED.card_ids, configuration_time = EXCLUDED.configuration_time
       """
    for {      parameters <- IO {
        List(
          SqlParameter("String", userID),
          SqlParameter("String", cardIDs.asJson.noSpaces),
          SqlParameter("DateTime", DateTime.now.getMillis.toString)
        )
      }
      writeResult <- writeDB(sql, parameters)
      _ <- IO(logger.info(s"更新战斗卡组成功，数据库返回: ${writeResult}"))
    } yield "战斗卡组设置成功！"
  }
}