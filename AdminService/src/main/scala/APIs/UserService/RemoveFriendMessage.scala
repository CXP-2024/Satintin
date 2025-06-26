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
 * RemoveFriendMessage
 * desc: 从好友列表中移除指定好友ID。
 * @param userToken: String (用户标识Token，用于验证用户身份)
 * @param friendID: String (好友的唯一标识ID)
 * @return result: String (操作结果信息，例如“好友已移除！”)
 */

case class RemoveFriendMessage(
  userToken: String,
  friendID: String
) extends API[String](UserServiceCode)



case object RemoveFriendMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[RemoveFriendMessage] = deriveEncoder
  private val circeDecoder: Decoder[RemoveFriendMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[RemoveFriendMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[RemoveFriendMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[RemoveFriendMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given removeFriendMessageEncoder: Encoder[RemoveFriendMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given removeFriendMessageDecoder: Decoder[RemoveFriendMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

