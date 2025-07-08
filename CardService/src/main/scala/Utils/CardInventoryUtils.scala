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
import Objects.CardService.CardEntry

case object CardInventoryUtils {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 获取用户的卡牌库存
   * @param userID 用户ID
   * @return 用户的卡牌列表
   */
  def fetchUserCardInventory(userID: String)(using PlanContext): IO[List[CardEntry]] = {
    for {
      // Step 1: Validate input parameter
      _ <- IO(logger.info(s"开始验证输入参数 userId: ${userID}"))
      _ <- if (userID == null || userID.trim.isEmpty) {
             IO.raiseError(new IllegalArgumentException("输入参数 userID 不能为空或为空字符串"))
           } else {
             IO(logger.info(s"userID ${userID} 通过验证"))
           }

      // Step 2: 分页查询大量数据
      _ <- IO(logger.info(s"准备分页查询用户卡牌信息，userID=${userID}"))
      
      // 先查询总数
      countQuery <- IO {
        s"SELECT COUNT(*) as total FROM ${schemaName}.user_card_table WHERE user_id = ?"
      }
      countResult <- readDBRows(countQuery, List(SqlParameter("String", userID)))
      totalCards <- IO {
        countResult.headOption.map(json => decodeField[Int](json, "total")).getOrElse(0)
      }
      _ <- IO(logger.info(s"用户总卡牌数量: ${totalCards}"))

      // 分批查询，每批50张卡牌
      batchSize = 50
      totalBatches = Math.ceil(totalCards.toDouble / batchSize).toInt
      
      allCardEntries <- (0 until totalBatches).toList.traverse { batchIndex =>
        val offset = batchIndex * batchSize
        val sqlQuery = s"""
          SELECT 
            uc.user_card_id,
            uc.card_id, 
            uc.rarity_level, 
            uc.card_level,
            uc.acquisition_time,
            ct.card_name,
            ct.description,
            ct.type as card_type
          FROM ${schemaName}.user_card_table uc
          INNER JOIN ${schemaName}.card_template_table ct ON uc.card_id = ct.card_id
          WHERE uc.user_id = ?
          LIMIT ${batchSize} OFFSET ${offset};
          """.stripMargin
        
        for {
          _ <- IO(logger.info(s"查询第${batchIndex + 1}批，偏移量: ${offset}"))
          queryResults <- readDBRows(sqlQuery, List(SqlParameter("String", userID)))
          cardEntries <- IO {
            queryResults.map { json =>
              val userCardID  = decodeField[String](json, "userCardID")
              val cardID      = decodeField[String](json, "cardID")
              val rarityLevel = decodeField[String](json, "rarityLevel")
              val cardLevel   = decodeField[Int](json, "cardLevel")
              val acquisitionTime = DateTime.now
              val cardName    = decodeField[String](json, "cardName")
              val description = decodeField[String](json, "description")
              val cardType    = decodeField[String](json, "cardType")
              CardEntry(userCardID, cardID, rarityLevel, cardLevel, cardName, description, cardType, acquisitionTime)
            }
          }
        } yield cardEntries
      }
      
      finalCardEntries = allCardEntries.flatten
      _ <- IO(logger.info(s"成功分批查询完成，总计 ${finalCardEntries.size} 条记录"))

    } yield finalCardEntries
  }
}
