package Impl

import APIs.CardService.{GetAllCardTemplatesMessage, CardTemplate}
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class GetAllCardTemplatesMessagePlanner(
  userToken: String,
  override val planContext: PlanContext
) extends Planner[List[CardTemplate]] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[List[CardTemplate]] = {
    for {
      // Step 1: Validate user token (optional, since we're just fetching templates)
      _ <- IO(logger.info(s"[Step 1] 获取全部卡牌模板，用户Token: ${userToken}"))
      
      // Step 2: Query all card templates from database
      _ <- IO(logger.info(s"[Step 2] 从数据库查询全部卡牌模板"))
      sqlQuery <- IO {
        s"""
        SELECT card_id, card_name, rarity, description, type
        FROM ${schemaName}.card_template_table
        ORDER BY rarity, card_name;
        """.stripMargin
      }
      _ <- IO(logger.info(s"SQL查询语句: ${sqlQuery}"))

      // Step 3: Execute database query
      queryResults <- readDBRows(sqlQuery, List())
      _ <- IO(logger.info(s"从数据库查询到 ${queryResults.size} 个卡牌模板"))

      // Step 4: Map database results to CardTemplate objects
      cardTemplates <- IO {
        queryResults.map { json =>
          val cursor = json.hcursor
          val cardID = cursor.get[String]("cardID").getOrElse(cursor.get[String]("card_id").getOrElse(""))
          val cardName = cursor.get[String]("cardName").getOrElse(cursor.get[String]("card_name").getOrElse(""))
          val rarity = cursor.get[String]("rarity").getOrElse("")
          val description = cursor.get[String]("description").getOrElse("")
          val cardType = cursor.get[String]("cardType").getOrElse(cursor.get[String]("type").getOrElse("both"))
          
          CardTemplate(cardID, cardName, rarity, description, cardType)
        }
      }
      _ <- IO(logger.info(s"成功将查询结果转换为 CardTemplate 对象列表，共 ${cardTemplates.size} 条记录"))
      
    } yield cardTemplates
  }
}
