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
import Objects.CardService.CardTemplate

/**
 * GetAllCardTemplatesMessage
 * desc: 获取全部卡牌模板信息，用于展示所有可用的卡牌。
 * @return result: List[CardTemplate] (卡牌模板列表)
 */
case class GetAllCardTemplatesMessage(
  userToken: String
) extends API[List[CardTemplate]](CardServiceCode)

case object GetAllCardTemplatesMessage {
  
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[GetAllCardTemplatesMessage] = deriveEncoder
  private val circeDecoder: Decoder[GetAllCardTemplatesMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[GetAllCardTemplatesMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[GetAllCardTemplatesMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[GetAllCardTemplatesMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given getAllCardTemplatesMessageEncoder: Encoder[GetAllCardTemplatesMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given getAllCardTemplatesMessageDecoder: Decoder[GetAllCardTemplatesMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }

}
