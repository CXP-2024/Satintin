package APIs.UserService

import Common.API.API
import Global.ServiceCenter.UserServiceCode

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
 * FindOrCreateMatchRoomMessage
 * desc: 查找或创建匹配房间。
 * @param userToken: String (用户的登录令牌，用于标识当前用户。)
 * @param matchType: String (匹配类型，例如'quick'或'ranked')
 * @return roomInfo: Json (房间信息，包含room_id等)
 */

case class FindOrCreateMatchRoomMessage(
  userToken: String,
  matchType: String
) extends API[Json](UserServiceCode)



case object FindOrCreateMatchRoomMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[FindOrCreateMatchRoomMessage] = deriveEncoder
  private val circeDecoder: Decoder[FindOrCreateMatchRoomMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[FindOrCreateMatchRoomMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[FindOrCreateMatchRoomMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[FindOrCreateMatchRoomMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given findOrCreateMatchRoomMessageEncoder: Encoder[FindOrCreateMatchRoomMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given findOrCreateMatchRoomMessageDecoder: Decoder[FindOrCreateMatchRoomMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


} 