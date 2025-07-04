package Impl

import Common.API.API
import APIs.CardService.{GetDrawHistoryMessage, DrawHistoryEntry}
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import cats.implicits._
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import io.circe.parser._
import org.joda.time.DateTime
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import java.util.UUID

case class GetDrawHistoryMessagePlanner(
  userToken: String,
  override val planContext: PlanContext
) extends Planner[List[DrawHistoryEntry]] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[List[DrawHistoryEntry]] = {
    for {
      // Step 1: Validate user token
      _ <- IO(logger.info(s"[Step 1] 验证用户Token合法性: userToken=${userToken}"))
      // validation to be completed

      // Step 2: Get user ID from token (using token directly as userID for consistency)
      _ <- IO(logger.info(s"[Step 2] 使用Token作为用户ID"))
      userId = userToken  // 直接使用 token 作为 userID，与其他服务保持一致
      _ <- IO(logger.info(s"[Step 2.1] 用户ID: ${userId}"))

      // Step 3: Query draw history from database
      _ <- IO(logger.info(s"[Step 3] 查询用户抽卡历史记录"))
      drawLogs <- readDBRows(
        s"""
        SELECT draw_id, card_list, draw_time, pool_type
        FROM ${schemaName}.card_draw_log_table
        WHERE user_id = ?
        ORDER BY draw_time DESC
        """,
        List(SqlParameter("String", userId))
      )
      _ <- IO(logger.info(s"[Step 3.1] 查询到 ${drawLogs.length} 条抽卡记录"))

      // Step 4: Parse card lists and get card templates
      _ <- IO(logger.info(s"[Step 4] 解析抽卡记录并获取卡牌模板信息"))
      drawHistory <- drawLogs.traverse { row =>
        val drawId = decodeField[String](row, "draw_id")
        val cardListJson = decodeField[String](row, "card_list")
        val drawTime = decodeField[DateTime](row, "draw_time")
        val poolType = row.hcursor.downField("poolType").as[String].getOrElse("err")
          for {
          // Parse card list JSON - card IDs are stored as strings
          cardList <- IO.fromEither(parser.parse(cardListJson).flatMap(_.as[List[String]]))
            .handleErrorWith(e => 
              IO(logger.error(s"[Step 4.1] 解析卡牌列表JSON失败: drawId=${drawId}, error=${e.getMessage}"))
                >> IO.raiseError(new RuntimeException(s"解析卡牌列表失败: ${e.getMessage}"))
            )
          
          // Get card templates for each card
          cardEntries <- cardList.traverse { cardId =>            readDBRows(
              s"""
              SELECT card_id, card_name, description, rarity, type
              FROM ${schemaName}.card_template_table
              WHERE card_id = ?
              """,
              List(SqlParameter("String", cardId))
            ).flatMap { rows =>              rows.headOption match {
                case Some(cardRow) =>
                  IO.pure(DrawHistoryEntry(
                    drawId = drawId,
                    cardId = decodeField[String](cardRow, "card_id"),
                    cardName = decodeField[String](cardRow, "card_name"),
                    cardDescription = decodeField[String](cardRow, "description"),
                    rarity = decodeField[String](cardRow, "rarity"),
                    cardType = decodeField[String](cardRow, "type"),
                    drawTime = drawTime,
                    poolType = poolType
                  ))
                case None =>
                  IO(logger.warn(s"[Step 4.2] 卡牌模板不存在: cardId=${cardId}"))
                    >> IO.raiseError(new RuntimeException(s"卡牌模板不存在: cardId=${cardId}"))
              }
            }
          }
        } yield cardEntries
      }.map(_.flatten)
      
      _ <- IO(logger.info(s"[Step 4.3] 成功解析 ${drawHistory.length} 张卡牌的历史记录"))

      // Step 5: Return result
      _ <- IO(logger.info(s"[Step 5] 返回抽卡历史查询结果"))
    } yield drawHistory
  }
}