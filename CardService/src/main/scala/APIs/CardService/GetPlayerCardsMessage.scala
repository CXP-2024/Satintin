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
import Objects.CardService.CardEntry

/**
 * GetPlayerCardsMessage
 * desc: 根据用户ID返回用户所拥有的卡牌信息列表，处理查询玩家卡牌的需求。
 * @param userID: String (用户的身份令牌，用于验证用户的合法性。)
 * @return cardEntries: CardEntry:1124 (用户所拥有的卡牌列表，包含卡牌的基础信息与稀有度等数据。)
 */

case class GetPlayerCardsMessage(
  userID: String
) extends API[List[CardEntry]](CardServiceCode)



case object GetPlayerCardsMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[GetPlayerCardsMessage] = deriveEncoder
  private val circeDecoder: Decoder[GetPlayerCardsMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[GetPlayerCardsMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[GetPlayerCardsMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[GetPlayerCardsMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given getPlayerCardsMessageEncoder: Encoder[GetPlayerCardsMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given getPlayerCardsMessageDecoder: Decoder[GetPlayerCardsMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

