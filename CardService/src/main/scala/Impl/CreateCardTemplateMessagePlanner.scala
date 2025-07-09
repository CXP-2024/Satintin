package Impl

import Common.API.{PlanContext, Planner}
import APIs.UserService.GetUserInfoMessage
import org.slf4j.LoggerFactory
import java.util.UUID
import org.joda.time.DateTime
import cats.effect.IO
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import io.circe.generic.auto.*

case class CreateCardTemplateMessagePlanner(
  userID: String,
  cardName: String,
  rarity: String,
  description: String,
  cardType: String,
  override val planContext: PlanContext
) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 2: Validate input parameters
      _ <- IO(logger.info("[Step 2] 验证输入参数"))
      _ <- validateInputs(cardName, rarity, description, cardType)

      // Step 3: Generate card template ID and creation time
      _ <- IO(logger.info("[Step 3] 生成卡牌模板ID和创建时间"))
      cardTemplateId <- IO.pure(UUID.randomUUID().toString)
      creationTime <- IO.pure(DateTime.now.getMillis)
      _ <- IO(logger.info(s"生成的卡牌模板ID: ${cardTemplateId}"))      // Step 4: Insert card template into database
      _ <- IO(logger.info("[Step 4] 插入卡牌模板到数据库"))
      _ <- insertCardTemplate(cardTemplateId, cardName, rarity, description, cardType, creationTime)

      _ <- IO(logger.info(s"卡牌模板创建完成，ID: ${cardTemplateId}"))
    } yield cardTemplateId
  }

  // Method to validate input parameters
  private def validateInputs(cardName: String, rarity: String, description: String, cardType: String): IO[Unit] = {
    for {
      _ <- if (cardName == null || cardName.trim.isEmpty) {
        IO.raiseError(new IllegalArgumentException("卡牌名称不能为空"))
      } else IO.unit

      _ <- if (rarity == null || rarity.trim.isEmpty) {
        IO.raiseError(new IllegalArgumentException("卡牌稀有度不能为空"))
      } else IO.unit

      _ <- if (!List("普通", "稀有", "传说").contains(rarity)) {
        IO.raiseError(new IllegalArgumentException(s"卡牌稀有度必须是：普通、稀有、传说 之一，当前值: ${rarity}"))
      } else IO.unit

      _ <- if (description == null || description.trim.isEmpty) {
        IO.raiseError(new IllegalArgumentException("卡牌描述不能为空"))
      } else IO.unit

      _ <- if (!List("featured", "standard", "both").contains(cardType)) {
        IO.raiseError(new IllegalArgumentException(s"卡牌类型必须是：featured、standard、both 之一，当前值: ${cardType}"))
      } else IO.unit

      _ <- IO(logger.info(s"输入参数验证通过 - 卡牌名称: ${cardName}, 稀有度: ${rarity}, 描述: ${description}, 类型: ${cardType}"))
    } yield ()
  }
  // Method to insert card template
  private def insertCardTemplate(
    cardTemplateId: String,
    cardName: String,
    rarity: String,
    description: String,
    cardType: String,
    creationTime: Long
  )(using PlanContext): IO[Unit] = {
    for {
      insertQuery <- IO {
        s"""
           |INSERT INTO ${schemaName}.card_template_table (card_id, card_name, rarity, description, creation_time, type)
           |VALUES (?, ?, ?, ?, ?, ?)
           |""".stripMargin
      }
      insertParams <- IO {
        List(
          SqlParameter("String", cardTemplateId),
          SqlParameter("String", cardName),
          SqlParameter("String", rarity),
          SqlParameter("String", description),
          SqlParameter("DateTime", creationTime.toString),
          SqlParameter("String", cardType)
        )
      }
      _ <- writeDB(insertQuery, insertParams)
      _ <- IO(logger.info(s"卡牌模板插入完成 - ID: ${cardTemplateId}, 名称: ${cardName}, 类型: ${cardType}"))
    } yield ()
  }
}