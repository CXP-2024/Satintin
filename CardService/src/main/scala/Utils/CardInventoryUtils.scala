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

      // Step 2: Prepare and log SQL query for fetching user card inventory with template details
      _ <- IO(logger.info(s"准备查询用户卡牌信息并关联模板表，userID=${userID}"))
      sqlQuery <- IO {
        s"""
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
        WHERE uc.user_id = ?;
        """.stripMargin
      }
      _ <- IO(logger.info(s"SQL命令为: ${sqlQuery}"))

      // Step 3: Execute database query
      queryResults <- readDBRows(
        sqlQuery,
        List(SqlParameter("String", userID))
      )
      _ <- IO(logger.info(s"查询数据库返回了 ${queryResults.size} 条记录"))

      // Step 4: Map database results to CardEntry objects with template details
      cardEntries <- IO {
        queryResults.map { json =>
          // 按后端 send 出来的 camelCase 字段名来取
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
      _ <- IO(logger.info(s"成功将查询结果转换为 CardEntry 对象列表，共 ${cardEntries.size} 条记录"))

    } yield cardEntries
  }
}
