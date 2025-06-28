package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import cats.implicits._
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Utils.CardManagementProcess.fetchUserCardInventory
import Objects.UserService.MessageEntry
import Objects.CardService.CardEntry
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import APIs.AssetService.QueryAssetStatusMessage
import APIs.UserService.GetUserInfoMessage
import Objects.UserService.User
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Objects.CardService.DrawResult
import Objects.CardService.{DrawResult, CardEntry}
import Common.Object.{ParameterList, SqlParameter}
import java.util.UUID
import APIs.UserService.LogUserOperationMessage // Add missing import for the logging API message
import APIs.AssetService.DeductAssetMessage

case object CardManagementProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  def upgradeCard(userToken: String, userID: String, cardID: String)(using PlanContext): IO[String] = {
    for {
      // Step 1.1: Verify userID exists
      _ <- IO(logger.info(s"调用 UserService 验证用户 ID: ${userID}"))
      _ <- GetUserInfoMessage(userToken, userID)
            .send
            .handleErrorWith(_ =>
              IO.raiseError(new IllegalStateException(s"用户 ID ${userID} 不存在或 Token 非法"))
            )

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

  def fetchUserCardInventory(userID: String)(using PlanContext): IO[List[CardEntry]] = {
  // val logger = LoggerFactory.getLogger(this.getClass)  // 同文后端处理: logger 统一
  
    for {
      // Step 1: Validate input parameter
      _ <- IO(logger.info(s"开始验证输入参数 userId: ${userID}"))
      _ <- if (userID == null || userID.trim.isEmpty) {
             IO.raiseError(new IllegalArgumentException("输入参数 userID 不能为空或为空字符串"))
           } else {
             IO(logger.info(s"userID ${userID} 通过验证"))
           }
  
      // Step 2: Prepare and log SQL query for fetching user card inventory
      _ <- IO(logger.info(s"准备查询用户卡牌信息，userID=${userID}"))
      sqlQuery <- IO {
        s"""
        SELECT card_id, rarity_level, card_level
        FROM ${schemaName}.user_card_table
        WHERE user_id = ?;
        """.stripMargin
      }
      _ <- IO(logger.info(s"SQL命令为: ${sqlQuery}"))
  
      // Step 3: Execute database query
      queryResults <- readDBRows(
        sqlQuery,
        List(SqlParameter("String", userID))
      )
      _ <- IO(logger.info(s"查询数据库返回了 ${queryResults.size} 条记录"))
  
      // Step 4: Map database results to CardEntry objects
      cardEntries <- IO {
        queryResults.map { json =>
          val cardID = decodeField[String](json, "card_id")
          val rarityLevel = decodeField[String](json, "rarity_level")
          val cardLevel = decodeField[Int](json, "card_level")
          CardEntry(cardID, rarityLevel, cardLevel)
        }
      }
      _ <- IO(logger.info(s"成功将查询结果转换为 CardEntry 对象列表，共 ${cardEntries.size} 条记录"))
  
    } yield cardEntries
  }
  
  def drawCards(userToken: String, userID: String, drawCount: Int)(using PlanContext): IO[DrawResult] = {
  // val logger = LoggerFactory.getLogger(this.getClass)  // 同文后端处理: logger 统一
    val MAX_DRAW_COUNT = 10
    val STONE_COST_PER_DRAW = 100
  
    for {
      // Step 1: Validate input parameters
      _ <- IO(logger.info(s"验证输入参数 userID=${userID}, drawCount=${drawCount}"))
      _ <- if (userID == null || userID.trim.isEmpty) {
        IO.raiseError(new IllegalArgumentException("userID 不能为空"))
      } else IO.unit
      _ <- if (drawCount <= 0 || drawCount > MAX_DRAW_COUNT) {
        IO.raiseError(new IllegalArgumentException(s"drawCount 无效，必须在 1 到 ${MAX_DRAW_COUNT} 之间"))
      } else IO.unit
  
      // Step 2: Fetch and validate user's stone count
      _ <- IO(logger.info(s"校验用户[userID=${userID}]的原石数量"))
      _ <- IO(logger.info(s"调用 AssetService 查询原石数量 userID=${userID}"))
      userStone <- QueryAssetStatusMessage(userToken).send
      _ <- if (userStone < drawCount * STONE_COST_PER_DRAW) {
        IO.raiseError(new IllegalStateException(s"原石数量不足，本次抽卡需要消耗 ${drawCount * STONE_COST_PER_DRAW} 原石，但当前仅有 ${userStone} 原石"))
      } else IO.unit
  
      // Step 3: Fetch user's card inventory
      _ <- IO(logger.info(s"获取用户[userID=${userID}]的卡牌库存"))
      userCardInventory <- fetchUserCardInventory(userID)
      userOwnedCardIDs = userCardInventory.map(_.cardID)
      _ <- IO(logger.info(s"用户已有卡牌 cardIDs=${userOwnedCardIDs.mkString(", ")}"))
  
      // Step 4: Generate card draw results
      _ <- IO(logger.info(s"开始生成符合概率的抽卡结果，drawCount=${drawCount}"))
      generatedCards <- IO {
        (1 to drawCount).map { _ =>
          val cardID = UUID.randomUUID().toString
          val rarityLevel = if (scala.util.Random.nextDouble() < 0.05) "SSR" else "R"
          val cardLevel = 1
          CardEntry(cardID, rarityLevel, cardLevel)
        }.toList
      }
      _ <- IO(logger.info(s"生成的抽卡结果: ${generatedCards.map(c => s"[cardID=${c.cardID}, rarity=${c.rarityLevel}]").mkString(", ")}"))
  
      // Step 5: Check for new cards
      isNewCard = generatedCards.exists(card => !userOwnedCardIDs.contains(card.cardID))
      _ <- IO(logger.info(s"判断是否有新卡片：isNewCard=${isNewCard}"))
  
      // Step 6: Deduct stones from the user's account
      stonesToDeduct = drawCount * STONE_COST_PER_DRAW
      _ <- IO(logger.info(s"调用 AssetService 扣减原石，userID=${userID}, 数量=${stonesToDeduct}"))
      _ <- DeductAssetMessage(userToken, stonesToDeduct).send
  
      // Step 7: Log the draw results in CardDrawLogTable
      _ <- IO(logger.info(s"记录本次抽卡信息到CardDrawLogTable"))
      drawLogQuery <- IO(s"""
        INSERT INTO ${schemaName}.card_draw_log_table (draw_id, user_id, card_list, draw_time, total_stone_consumed)
        VALUES (?, ?, ?, ?, ?)
      """)
      drawLogParams <- IO(List(
        SqlParameter("String", UUID.randomUUID().toString),
        SqlParameter("String", userID),
        SqlParameter("String", generatedCards.asJson.noSpaces),
        SqlParameter("DateTime", DateTime.now.getMillis.toString),
        SqlParameter("Int", stonesToDeduct.toString)
      ))
      _ <- writeDB(drawLogQuery, drawLogParams)
  
      // Step 8: Update user's card library with new cards
      _ <- IO(logger.info(s"更新用户[userID=${userID}]的卡牌库，追加新获得的卡牌"))
      newCardsToAdd <- IO {
        generatedCards.filter(card => !userOwnedCardIDs.contains(card.cardID)).map { card =>
          ParameterList(List(
            SqlParameter("String", UUID.randomUUID().toString),
            SqlParameter("String", userID),
            SqlParameter("String", card.cardID),
            SqlParameter("String", card.rarityLevel),
            SqlParameter("Int", card.cardLevel.toString),
            SqlParameter("DateTime", DateTime.now.getMillis.toString)
          ))
        }
      }
      _ <- if (newCardsToAdd.nonEmpty) {
        val insertUserCardsQuery = s"""
          INSERT INTO ${schemaName}.user_card_table (user_card_id, user_id, card_id, rarity_level, card_level, acquisition_time)
          VALUES (?, ?, ?, ?, ?, ?)
        """
        writeDBList(insertUserCardsQuery, newCardsToAdd)
      } else {
        IO(logger.info("没有新卡牌需要追加到库中"))
      }
  
      // Step 9: Return the draw results
      result <- IO.pure(DrawResult(generatedCards, isNewCard))
      _ <- IO(logger.info(s"抽卡操作完成，返回结果: ${result}"))
  
    } yield result
  }
}
