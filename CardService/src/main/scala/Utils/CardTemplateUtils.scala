package Utils

import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import cats.implicits._
import Common.API.PlanContext
import cats.effect.IO
import Common.Object.SqlParameter
import Objects.CardService.CardTemplate

case object CardTemplateUtils {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 从数据库获取卡牌模板
   * @param poolType 卡池类型
   * @return 卡牌模板列表
   */
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
      _ <- IO(logger.info(s"从数据库查询到 ${queryResults.size} 个卡牌模板"))

      // Map database results to CardTemplate objects
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
}