package Impl

import APIs.CardService.{GetCardTemplateByIDMessage, CardTemplate}
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

case class GetCardTemplateByIDMessagePlanner(
  cardID: String,
  override val planContext: PlanContext
) extends Planner[CardTemplate] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[CardTemplate] = {
    for {
      // Step 1: Validate input parameters
      _ <- IO(logger.info(s"[Step 1] 开始根据卡牌ID查询卡牌模板，cardID='${cardID}'"))

      // Step 2: Query card template from database by cardID
      sqlQuery <- IO {
        s"""
        SELECT card_id, card_name, rarity, description, type
        FROM ${schemaName}.card_template_table
        WHERE card_id = ?;
        """.stripMargin
      }
      queryParams <- IO {
        List(SqlParameter("String", cardID))
      }
      _ <- IO(logger.info(s"[Step 2] SQL查询语句: ${sqlQuery}, 参数: ${queryParams}"))

      // Step 3: Execute database query
      queryResult <- readDBJsonOptional(sqlQuery, queryParams)
      _ <- IO(logger.info(s"[Step 3] 数据库查询完成"))

      // Step 4: Process query result
      cardTemplate <- queryResult match {
        case Some(json) =>
          IO {
            val cursor = json.hcursor
            val foundCardID = cursor.get[String]("cardID").getOrElse(cursor.get[String]("card_id").getOrElse(""))
            val cardName = cursor.get[String]("cardName").getOrElse(cursor.get[String]("card_name").getOrElse(""))
            val rarity = cursor.get[String]("rarity").getOrElse("")
            val description = cursor.get[String]("description").getOrElse("")
            val cardType = cursor.get[String]("cardType").getOrElse(cursor.get[String]("type").getOrElse("both"))
            
            logger.info(s"[Step 4] 成功找到卡牌模板: ID=${foundCardID}, Name=${cardName}, Rarity=${rarity}")
            CardTemplate(foundCardID, cardName, rarity, description, cardType)
          }
        case None =>
          val errorMessage = s"[Step 4] 未找到ID为'${cardID}'的卡牌模板"
          IO(logger.warn(errorMessage)) >>
          IO.raiseError(new RuntimeException(s"卡牌ID '${cardID}' 不存在"))
      }
      
    } yield cardTemplate
  }
}
