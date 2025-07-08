package APIs.CardService

import Common.API.API
import Global.ServiceCenter.CardServiceCode

import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import io.circe.generic.auto.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils

import scala.util.Try

import org.joda.time.DateTime
import java.util.UUID
import Objects.CardService.DrawHistoryEntry

/**
 * GetDrawHistoryMessage
 * desc: 根据用户Token查询抽卡历史，返回所有获得的卡、抽取时间与卡池类型。
 * @param userID: String (用户的身份令牌，用于验证用户的合法性。)
 * @return drawHistory: List[DrawHistoryEntry] (用户的抽卡历史记录列表)
 */
case class GetDrawHistoryMessage(
  userID: String
) extends API[List[DrawHistoryEntry]](CardServiceCode)

case object GetDrawHistoryMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[GetDrawHistoryMessage] = deriveEncoder
  private val circeDecoder: Decoder[GetDrawHistoryMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[GetDrawHistoryMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[GetDrawHistoryMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[GetDrawHistoryMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }

  // 根据环境决定使用哪种序列化方式
  given encoder: Encoder[GetDrawHistoryMessage] = 
    if (System.getProperty("SerializeWithJackson") == "true") jacksonEncoder 
    else circeEncoder

  given decoder: Decoder[GetDrawHistoryMessage] = 
    if (System.getProperty("SerializeWithJackson") == "true") jacksonDecoder 
    else circeDecoder

  def apply(userID: String): GetDrawHistoryMessage = {
    new GetDrawHistoryMessage(userID)
  }
}
