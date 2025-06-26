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
import Objects.UserService.MessageEntry

/**
 * ReceiveMessagesMessage
 * desc: 按分类返回用户的消息记录，包括好友消息、大世界消息、系统消息。
 * @param userToken: String (用户凭证，用于验证用户身份。)
 * @return messages: MessageEntry:1022 (用户的消息记录列表，包含消息来源、内容及时间。)
 */

case class ReceiveMessagesMessage(
  userToken: String
) extends API[List[MessageEntry]](UserServiceCode)



case object ReceiveMessagesMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[ReceiveMessagesMessage] = deriveEncoder
  private val circeDecoder: Decoder[ReceiveMessagesMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ReceiveMessagesMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[ReceiveMessagesMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ReceiveMessagesMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given receiveMessagesMessageEncoder: Encoder[ReceiveMessagesMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given receiveMessagesMessageDecoder: Decoder[ReceiveMessagesMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

