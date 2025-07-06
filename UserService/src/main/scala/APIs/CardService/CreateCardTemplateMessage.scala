package APIs.CardService

import Common.API.{PlanContext, TraceID}
import Common.Object.SqlParameter
import Common.API.API
import Global.ServiceCenter.CardServiceCode
import cats.effect.IO
import io.circe.generic.auto.*
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils
import scala.util.Try
import Impl.CreateCardTemplateMessagePlanner

/**
 * CreateCardTemplateMessage
 * desc: 创建卡牌模板，插入到card_template_table
 * @param userToken: String (用户认证token)
 * @param cardName: String (卡牌名称)  
 * @param rarity: String (卡牌稀有度，如普通、稀有、传说)
 * @param description: String (卡牌技能描述)
 * @param cardType: String (卡牌池类型：featured/standard/both，必填)
 * @return cardTemplateId: String (创建的卡牌模板ID)
 */
case class CreateCardTemplateMessage(
  userToken: String,
  cardName: String,
  rarity: String, 
  description: String,
  cardType: String
) extends API[String](CardServiceCode)

case object CreateCardTemplateMessage{
    
  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[CreateCardTemplateMessage] = deriveEncoder
  private val circeDecoder: Decoder[CreateCardTemplateMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[CreateCardTemplateMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[CreateCardTemplateMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[CreateCardTemplateMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given createCardTemplateMessageEncoder: Encoder[CreateCardTemplateMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given createCardTemplateMessageDecoder: Decoder[CreateCardTemplateMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
}
