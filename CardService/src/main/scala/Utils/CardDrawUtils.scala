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
import Common.Object.{SqlParameter, ParameterList}
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.CardService.{CardEntry, DrawResult, CardTemplate}
import APIs.AssetService.{QueryAssetStatusMessage, DeductAssetMessage, UpdateCardDrawCountMessage, QueryCardDrawCountMessage}
import Utils.CardInventoryUtils.fetchUserCardInventory
import Utils.CardTemplateUtils.fetchCardTemplatesFromDB
import java.util.UUID

case object CardDrawUtils {
  private val logger = LoggerFactory.getLogger(getClass)
  
  private val MAX_DRAW_COUNT = 10
  private val STONE_COST_PER_DRAW = 160

  /**
   * 抽卡功能
   * @param userID 用户ID
   * @param drawCount 抽卡次数
   * @param poolType 卡池类型
   * @return 抽卡结果
   */
  def drawCards(userID: String, drawCount: Int, poolType: String)(using PlanContext): IO[DrawResult] = {
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
      userStone <- QueryAssetStatusMessage(userID).send
      _ <- if (userStone < drawCount * STONE_COST_PER_DRAW) {
        IO.raiseError(new IllegalStateException(s"原石数量不足，本次抽卡需要消耗 ${drawCount * STONE_COST_PER_DRAW} 原石，但当前仅有 ${userStone} 原石"))
      } else IO.unit

      // Step 2.5: Fetch current card draw count for pity system
      _ <- IO(logger.info(s"获取用户[userID=${userID}]在${poolType}池的当前抽卡次数用于保底计算"))
      currentDrawCount <- QueryCardDrawCountMessage(userID, poolType).send
      _ <- IO(logger.info(s"用户在${poolType}池当前抽卡次数: ${currentDrawCount}"))

      // Step 3: Fetch user's card inventory
      _ <- IO(logger.info(s"获取用户[userID=${userID}]的卡牌库存"))
      userCardInventory <- fetchUserCardInventory(userID)
      userOwnedCardIDs = userCardInventory.map(_.cardID)
      _ <- IO(logger.info(s"用户已有卡牌 cardIDs=${userOwnedCardIDs.mkString(", ")}"))

      // Step 3.5: Fetch card templates from database based on pool type
      _ <- IO(logger.info(s"从数据库获取卡牌模板，卡池类型=${poolType}"))
      cardTemplatesFromDB <- fetchCardTemplatesFromDB(poolType)
      templatesByRarityFromDB = cardTemplatesFromDB.groupBy(_.rarity)
      _ <- IO(logger.info(s"从数据库获取到 ${cardTemplatesFromDB.size} 个卡牌模板"))

      // Step 4: 生成抽卡结果
      (generatedInfos, finalDrawCount, hasGotLegendary) <- IO {
        var currentPityCount = currentDrawCount
        var gotLegendary     = false
        var tenDrawNormalCnt = 0

        val results = (1 to drawCount).toList.map { drawIndex =>
          currentPityCount += 1
          
          // Calculate probabilities based on pity system
          val baseLegendaryRate = 0.6
          val pityLegendaryRate = if (currentPityCount > 73) {
            // Pity system: 0.6% + 6% * (n-73) after 73 draws
            baseLegendaryRate + 6.0 * (currentPityCount - 73)
          } else {
            baseLegendaryRate
          }
          // Ensure 100% legendary at 90th draw
          val legendaryRate = if (currentPityCount >= 90) 100.0 else pityLegendaryRate
          val baseRareRate = 5.5
          
          // Adjust rare rate if legendary rate increases
          val adjustedRareRate = if (legendaryRate > baseLegendaryRate) {
            baseRareRate * (100.0 - legendaryRate) / (100.0 - baseLegendaryRate)
          } else {
            baseRareRate
          }
          
          var normalRate = 100.0 - legendaryRate - adjustedRareRate
          var finalRareRate = adjustedRareRate
          
          // 十连抽保底机制：如果是十连抽且前9抽都是普通卡，第10抽必须出稀有以上
          if (drawCount == 10 && drawIndex == 10 && tenDrawNormalCnt == 9) {
            // 第10抽且前9抽都是普通卡，将普通卡概率全部分给稀有卡
            finalRareRate = adjustedRareRate + normalRate
            normalRate = 0.0
            println(s"十连抽保底触发：第10抽，前9抽都是普通卡，稀有概率调整为${finalRareRate}%，普通概率调整为${normalRate}%")
          }
          
          // Log the probabilities for this draw
          println(s"第${drawIndex}抽: 当前累计抽卡次数=${currentPityCount}, 传说概率=${legendaryRate}%, 稀有概率=${finalRareRate}%, 普通概率=${normalRate}%")
          
          val rand = scala.util.Random.nextDouble() * 100
          val rarityName = if (rand < legendaryRate) {
            gotLegendary = true
            currentPityCount = 0  // Reset pity counter when getting legendary
            "传说"
          } else if (rand < legendaryRate + finalRareRate) {
            "稀有"
          } else {
            // 统计十连抽中的普通卡数量
            if (drawCount == 10) {
              tenDrawNormalCnt += 1
            }
            "普通"
          }
          val pool = templatesByRarityFromDB.getOrElse(rarityName, Nil)
          if (pool.isEmpty) {
            throw new IllegalStateException(s"数据库中没有找到稀有度为 ${rarityName} 的卡牌模板")
          }
          
          val template = pool(scala.util.Random.nextInt(pool.size))
          val creationTime = DateTime.now
          val userCardID = UUID.randomUUID().toString
          CardEntry(
            userCardID = userCardID,
            cardID = template.cardID,
            rarityLevel = template.rarity,
            cardLevel = 1,
            cardName = template.cardName,
            description = template.description,
            cardType = template.cardType,
            creationTime = creationTime
          )
        }
        
        // 记录十连抽保底结果
        if (drawCount == 10) {
          println(s"十连抽完成，普通卡数量：${tenDrawNormalCnt}/10")
        }
        
        (results, currentPityCount, gotLegendary)
      }

      _ <- IO(logger.info(s"生成的抽卡结果: ${generatedInfos.map(info => s"[cardID=${info.cardID}, rarity=${info.rarityLevel}]").mkString(", ")}"))
      _ <- IO(logger.info(s"保底计算结果: 最终累计抽卡次数=${finalDrawCount}, 是否出金=${hasGotLegendary}"))
      
      // Step 5: Check for new cards
      isNewCard = generatedInfos.exists(info => !userOwnedCardIDs.contains(info.cardID))
      _ <- IO(logger.info(s"判断是否有新卡片：isNewCard=${isNewCard}"))

      // Step 6: Deduct stones from the user's account
      stonesToDeduct = drawCount * STONE_COST_PER_DRAW
      _ <- IO(logger.info(s"调用 AssetService 扣减原石，userID=${userID}, 数量=${stonesToDeduct}"))

      // Step 7: Log the draw results in CardDrawLogTable
      _ <- IO(logger.info(s"记录本次抽卡信息到CardDrawLogTable"))
      drawLogID <- IO.pure(UUID.randomUUID().toString)
      currentTime <- IO.pure(DateTime.now)
      drawLogQuery <- IO(s"""
        INSERT INTO ${schemaName}.card_draw_log_table (draw_id, user_id, card_list, draw_time, total_stone_consumed, pool_type)
        VALUES (?, ?, ?, ?, ?, ?)
      """)
      drawLogParams <- IO(List(
        SqlParameter("String", drawLogID),
        SqlParameter("String", userID),
        SqlParameter("String", generatedInfos.map(_.cardID).asJson.noSpaces),
        SqlParameter("DateTime", encodeDateTime(currentTime).asJson.noSpaces),
        SqlParameter("Int", stonesToDeduct.toString),
        SqlParameter("String", poolType)
      ))
      _ <- writeDB(drawLogQuery, drawLogParams)

      // Step 7.5: Deduct stones from user's account
      _ <- IO(logger.info(s"调用 AssetService 扣减原石，userID=${userID}, 数量=${stonesToDeduct}"))
      _ <- DeductAssetMessage(userID, stonesToDeduct).send
      _ <- IO(logger.info(s"成功扣减原石，数量=${stonesToDeduct}"))

      // Step 7.6: Update card draw count with pity system consideration
      _ <- IO(logger.info(s"更新用户抽卡次数，考虑保底重置机制"))
      _ <- UpdateCardDrawCountMessage(userID, poolType, finalDrawCount).send
      _ <- IO(logger.info(s"抽卡次数更新完成，最终抽卡次数=${finalDrawCount}"))

      // Step 8: Update user's card library with new cards
      _ <- IO(logger.info(s"更新用户[userID=${userID}]的卡牌库，为每张抽到的卡牌添加记录"))
      cardsToAdd <- IO {
        generatedInfos.map { info =>
          ParameterList(List(
            SqlParameter("String", info.userCardID),
            SqlParameter("String", userID),
            SqlParameter("String", info.cardID),
            SqlParameter("String", info.rarityLevel),
            SqlParameter("Int", info.cardLevel.toString),
            SqlParameter("DateTime", encodeDateTime(info.creationTime).asJson.noSpaces)
          ))
        }
      }
      _ <- if (cardsToAdd.nonEmpty) {
        val insertUserCardsQuery = s"""
          INSERT INTO ${schemaName}.user_card_table (user_card_id, user_id, card_id, rarity_level, card_level, acquisition_time)
          VALUES (?, ?, ?, ?, ?, ?)
        """
        writeDBList(insertUserCardsQuery, cardsToAdd)
      } else {
        IO(logger.info("没有卡牌需要添加到库中"))
      }

      // Step 9: Return the draw results
      result <- IO.pure(DrawResult(generatedInfos, isNewCard))
      _ <- IO(logger.info(s"抽卡操作完成，返回结果: ${result}"))

    } yield result
  }
}