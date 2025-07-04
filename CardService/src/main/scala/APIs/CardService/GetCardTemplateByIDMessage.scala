package APIs.CardService

import Common.API.API
import Global.ServiceCenter.CardServiceCode
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils
import scala.util.Try
import org.joda.time.DateTime
import java.util.UUID

/**
 * GetCardTemplateByIDMessage
 * desc: 根据卡牌ID获取卡牌模板信息
 * @param cardID: String (要查询的卡牌ID)
 * @return result: CardTemplate (卡牌模板信息，如果不存在则抛出异常)
 */
case class GetCardTemplateByIDMessage(
  userToken: String,
  cardID: String
) extends API[CardTemplate](CardServiceCode)

case object GetCardTemplateByIDMessage {
  
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[GetCardTemplateByIDMessage] = deriveEncoder
  private val circeDecoder: Decoder[GetCardTemplateByIDMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[GetCardTemplateByIDMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[GetCardTemplateByIDMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[GetCardTemplateByIDMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given getCardTemplateByIDMessageEncoder: Encoder[GetCardTemplateByIDMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given getCardTemplateByIDMessageDecoder: Decoder[GetCardTemplateByIDMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }

}
