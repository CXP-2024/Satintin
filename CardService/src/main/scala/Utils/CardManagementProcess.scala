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
import Objects.CardService.{CardEntry, DrawCardInfo, DrawResult}
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import APIs.AssetService.QueryAssetStatusMessage
import APIs.UserService.GetUserInfoMessage
import Objects.UserService.User
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.Object.{ParameterList, SqlParameter}
import java.util.UUID
import APIs.UserService.LogUserOperationMessage // Add missing import for the logging API message
import APIs.AssetService.DeductAssetMessage
import APIs.AssetService.UpdateCardDrawCountMessage
import APIs.AssetService.QueryCardDrawCountMessage

case object CardManagementProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  // metadata for front-end CARDS: name, rarity, skill description
  case class CardTemplate(cardID: String, cardName: String, rarity: String, description: String, cardType: String = "both")
  
  // Legacy hardcoded templates (kept for backward compatibility)
  private val cardTemplates = List(
    CardTemplate("legacy-dragon-nai", "Dragon Nai", "传说", "反弹"),
    CardTemplate("legacy-gaia", "盖亚", "传说", "穿透"),
    CardTemplate("legacy-go", "Go", "传说", "发育"),
    CardTemplate("legacy-jie", "杰哥", "传说", "穿透"),
    CardTemplate("legacy-paimon", "Paimon", "稀有", "反弹"),
    CardTemplate("legacy-kun", "坤", "稀有", "穿透"),
    CardTemplate("legacy-man", "man", "稀有", "发育"),
    CardTemplate("legacy-ice", "冰", "普通", "反弹"),
    CardTemplate("legacy-wlm", "wlm", "普通", "发育")
  )
  private val templatesByRarity: Map[String, List[CardTemplate]] = cardTemplates.groupBy(_.rarity)

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
           }      // Step 2: Prepare and log SQL query for fetching user card inventory with template details
      _ <- IO(logger.info(s"准备查询用户卡牌信息并关联模板表，userID=${userID}"))
      sqlQuery <- IO {
        s"""
        SELECT 
          uc.user_card_id,
          uc.card_id, 
          uc.rarity_level, 
          uc.card_level,
          ct.card_name,
          ct.description,
          ct.type as card_type
        FROM ${schemaName}.user_card_table uc
        INNER JOIN ${schemaName}.card_template_table ct ON uc.card_id = ct.card_id
        WHERE uc.user_id = ?;
        """.stripMargin
      }
      _ <- IO(logger.info(s"SQL命令为: ${sqlQuery}"))
  
      // Step 3: Execute database query
      queryResults <- readDBRows(
        sqlQuery,
        List(SqlParameter("String", userID))
      )
      _ <- IO(logger.info(s"查询数据库返回了 ${queryResults.size} 条记录"))      // Step 4: Map database results to CardEntry objects with template details
      cardEntries <- IO {
        queryResults.map { json =>
          // 按后端 send 出来的 camelCase 字段名来取
          val userCardID  = decodeField[String](json, "userCardID")
          val cardID      = decodeField[String](json, "cardID")
          val rarityLevel = decodeField[String](json, "rarityLevel")
          val cardLevel   = decodeField[Int](json, "cardLevel")
          val cardName    = decodeField[String](json, "cardName")
          val description = decodeField[String](json, "description")
          val cardType    = decodeField[String](json, "cardType")
          CardEntry(userCardID, cardID, rarityLevel, cardLevel, cardName, description, cardType)
        }
      }
      _ <- IO(logger.info(s"成功将查询结果转换为 CardEntry 对象列表，共 ${cardEntries.size} 条记录"))
  
    } yield cardEntries
  }
    def drawCards(userToken: String, userID: String, drawCount: Int, poolType: String)(using PlanContext): IO[DrawResult] = {
  // val logger = LoggerFactory.getLogger(this.getClass)  // 同文后端处理: logger 统一
    val MAX_DRAW_COUNT = 10
    val STONE_COST_PER_DRAW = 160
  
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

      // Step 2.5: Fetch current card draw count for pity system
      _ <- IO(logger.info(s"获取用户[userID=${userID}]的当前抽卡次数用于保底计算"))
      currentDrawCount <- QueryCardDrawCountMessage(userToken).send
      _ <- IO(logger.info(s"用户当前抽卡次数: ${currentDrawCount}"))

      // Step 3: Fetch user's card inventory
      _ <- IO(logger.info(s"获取用户[userID=${userID}]的卡牌库存"))
      userCardInventory <- fetchUserCardInventory(userID)
      userOwnedCardIDs = userCardInventory.map(_.cardID)
      _ <- IO(logger.info(s"用户已有卡牌 cardIDs=${userOwnedCardIDs.mkString(", ")}"))

      // Step 3.5: Fetch card templates from database based on pool type
      _ <- IO(logger.info(s"从数据库获取卡牌模板，卡池类型=${poolType}"))
      cardTemplatesFromDB <- fetchCardTemplatesFromDB(poolType)
      templatesByRarityFromDB = cardTemplatesFromDB.groupBy(_.rarity)
      _ <- IO(logger.info(s"从数据库获取到 ${cardTemplatesFromDB.size} 个卡牌模板"))      // Step 4: Generate card draw results with pity system
      _ <- IO(logger.info(s"开始生成符合保底机制的抽卡结果，drawCount=${drawCount}"))
      (generatedInfos, finalDrawCount, hasGotLegendary) <- IO {
        var currentPityCount = currentDrawCount
        var gotLegendary = false
        var tenDrawNormalCount = 0  // 十连抽中普通卡的计数
        
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
          if (drawCount == 10 && drawIndex == 10 && tenDrawNormalCount == 9) {
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
              tenDrawNormalCount += 1
            }
            "普通"
          }
          
          val pool = templatesByRarityFromDB.getOrElse(rarityName, Nil)
          if (pool.isEmpty) {
            throw new IllegalStateException(s"数据库中没有找到稀有度为 ${rarityName} 的卡牌模板")
          }
          val template = pool(scala.util.Random.nextInt(pool.size))
          val creationTime = DateTime.now.getMillis
          DrawCardInfo(
            cardID = template.cardID,
            cardName = template.cardName,
            rarity = template.rarity,
            description = template.description,
            creationTime = creationTime
          )
        }
        
        // 记录十连抽保底结果
        if (drawCount == 10) {
          println(s"十连抽完成，普通卡数量：${tenDrawNormalCount}/10")
        }
        
        (results, currentPityCount, gotLegendary)
      }
      _ <- IO(logger.info(s"生成的抽卡结果: ${generatedInfos.map(info => s"[cardID=${info.cardID}, rarity=${info.rarity}]").mkString(", ")}"))
      _ <- IO(logger.info(s"保底计算结果: 最终累计抽卡次数=${finalDrawCount}, 是否出金=${hasGotLegendary}"))
      
      // Step 5: Check for new cards
      isNewCard = generatedInfos.exists(info => !userOwnedCardIDs.contains(info.cardID))
      _ <- IO(logger.info(s"判断是否有新卡片：isNewCard=${isNewCard}"))

      // Step 6: Deduct stones from the user's account
      stonesToDeduct = drawCount * STONE_COST_PER_DRAW
      _ <- IO(logger.info(s"调用 AssetService 扣减原石，userID=${userID}, 数量=${stonesToDeduct}"))

      // Step 7: Log the draw results in CardDrawLogTable
      _ <- IO(logger.info(s"记录本次抽卡信息到CardDrawLogTable"))
      currentTime <- IO.pure(DateTime.now.getMillis)
      drawLogQuery <- IO(s"""
        INSERT INTO ${schemaName}.card_draw_log_table (draw_id, user_id, card_list, draw_time, total_stone_consumed, pool_type)
        VALUES (?, ?, ?, ?, ?, ?)
      """)
      drawLogParams <- IO(List(
        SqlParameter("String", UUID.randomUUID().toString),
        SqlParameter("String", userID),
        SqlParameter("String", generatedInfos.map(_.cardID).asJson.noSpaces),
        SqlParameter("DateTime", currentTime.toString),
        SqlParameter("Int", stonesToDeduct.toString),
        SqlParameter("String", poolType)
      ))
      _ <- writeDB(drawLogQuery, drawLogParams)

      // Step 7.5: Deduct stones from user's account
      _ <- IO(logger.info(s"调用 AssetService 扣减原石，userID=${userID}, 数量=${stonesToDeduct}"))
      _ <- DeductAssetMessage(userToken, stonesToDeduct).send
      _ <- IO(logger.info(s"成功扣减原石，数量=${stonesToDeduct}"))

      // Step 7.6: Update card draw count with pity system consideration
      _ <- IO(logger.info(s"更新用户抽卡次数，考虑保底重置机制"))
      _ <- if (hasGotLegendary) {
        // Reset draw count to final count (0 if got legendary on last draw, or remaining count)
        UpdateCardDrawCountMessage(userToken, finalDrawCount, isIncrement = false).send
      } else {
        // Just increment by drawCount
        UpdateCardDrawCountMessage(userToken, drawCount, isIncrement = true).send
      }
      _ <- IO(logger.info(s"抽卡次数更新完成，最终抽卡次数=${finalDrawCount}"))

      // Step 8: Update user's card library with new cards
      _ <- IO(logger.info(s"更新用户[userID=${userID}]的卡牌库，为每张抽到的卡牌添加记录"))
      // 每次抽卡都要插入新记录，不管用户是否已经拥有相同的cardID
      cardsToAdd <- IO {
        generatedInfos.map { info =>
          ParameterList(List(
            SqlParameter("String", UUID.randomUUID().toString),
            SqlParameter("String", userID),
            SqlParameter("String", info.cardID),
            SqlParameter("String", info.rarity),
            SqlParameter("Int", "1"),  // Initial level is 1
            SqlParameter("DateTime", info.creationTime.toString)
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
      }      // Step 9: Return the draw results
      result <- IO.pure(DrawResult(generatedInfos, isNewCard))
      _ <- IO(logger.info(s"抽卡操作完成，返回结果: ${result}"))

    } yield result
  }

  // Function to fetch card templates from database
  def fetchCardTemplatesFromDB(poolType: String)(using PlanContext): IO[List[CardTemplate]] = {
    for {
      _ <- IO(logger.info(s"从数据库获取卡牌模板，卡池类型：${poolType}"))
      sqlQuery <- IO {
        s"""
        SELECT card_id, card_name, rarity, description, type
        FROM ${schemaName}.card_template_table
        WHERE type = ? OR type = 'both'
        ORDER BY rarity, card_name;
        """.stripMargin
      }
      _ <- IO(logger.info(s"SQL查询语句: ${sqlQuery}"))

      // Execute database query - always use parameterized query for poolType filtering
      queryResults <- readDBRows(sqlQuery, List(SqlParameter("String", poolType)))
      _ <- IO(logger.info(s"从数据库查询到 ${queryResults.size} 个卡牌模板"))      // Map database results to CardTemplate objects
      cardTemplates <- IO {
        queryResults.map { json =>
          val cardID = decodeField[String](json, "card_id")
          val cardName = decodeField[String](json, "card_name")
          val rarity = decodeField[String](json, "rarity")
          val description = decodeField[String](json, "description")
          val cardType = decodeField[String](json, "type")
          CardTemplate(cardID, cardName, rarity, description, cardType)
        }
      }
      _ <- IO(logger.info(s"成功转换为 CardTemplate 对象，共 ${cardTemplates.size} 个模板"))
    } yield cardTemplates
  }

  // Function to load user's battle deck configuration
  def loadUserBattleDeck(userID: String)(using PlanContext): IO[List[String]] = {
    for {
      _ <- IO(logger.info(s"[loadUserBattleDeck] 开始加载用户战斗卡组，userID='${userID}'"))
      
      // Step 1: Validate input parameter
      _ <- if (userID == null || userID.trim.isEmpty) {
        IO.raiseError(new IllegalArgumentException("用户ID不能为空或无效"))
      } else {
        IO(logger.info("[loadUserBattleDeck] 输入参数验证通过"))
      }

      // Step 2: Query user battle deck from database
      querySQL <- IO {
        s"SELECT card_ids FROM ${schemaName}.user_battle_deck_table WHERE user_id = ?"
      }
      parameters <- IO(List(SqlParameter("String", userID)))
      _ <- IO(logger.info(s"[loadUserBattleDeck] 查询SQL: ${querySQL}，参数: ${parameters}"))

      // Step 3: Execute query and handle result
      result <- readDBJsonOptional(querySQL, parameters).flatMap {        case Some(json) =>
          val cardIdsJson = decodeField[String](json, "card_ids")
          IO {
            logger.info(s"[loadUserBattleDeck] 查询成功，原始卡组数据: ${cardIdsJson}")
          } >> {
            try {
              // 首先尝试直接解析JSON
              val deckCards = io.circe.parser.decode[List[String]](cardIdsJson) match {
                case Right(cards) => 
                  logger.info(s"[loadUserBattleDeck] JSON解析成功: ${cards}")
                  cards
                case Left(err) => 
                  logger.warn(s"[loadUserBattleDeck] 直接解析JSON失败: ${err.getMessage}")
                  // 尝试修复可能的格式问题
                  val cleanedJson = cardIdsJson
                    .replace("{", "[")
                    .replace("}", "]")
                    .replace("\"\"", "\"")
                  logger.info(s"[loadUserBattleDeck] 尝试修复后的JSON: ${cleanedJson}")
                  
                  io.circe.parser.decode[List[String]](cleanedJson) match {
                    case Right(cards) => 
                      logger.info(s"[loadUserBattleDeck] 修复后解析成功: ${cards}")
                      cards
                    case Left(err2) => 
                      logger.warn(s"[loadUserBattleDeck] 修复后仍解析失败: ${err2.getMessage}，返回空列表")
                      List.empty[String]
                  }
              }
              IO {
                logger.info(s"[loadUserBattleDeck] 解析完成，卡组包含 ${deckCards.size} 张卡牌: ${deckCards}")
              } >> IO.pure(deckCards)
            } catch {
              case e: Exception =>
                logger.warn(s"[loadUserBattleDeck] 解析卡组数据异常: ${e.getMessage}，返回空列表")
                IO.pure(List.empty[String])
            }
          }
        case None =>
          // User doesn't have a battle deck record yet
          IO(logger.info(s"[loadUserBattleDeck] 用户 ${userID} 暂无战斗卡组记录，返回空列表")) >>
          IO.pure(List.empty[String])
      }
    } yield result
  }
}
