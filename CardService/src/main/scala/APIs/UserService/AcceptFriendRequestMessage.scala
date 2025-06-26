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
 * AcceptFriendRequestMessage
 * desc: 更改好友请求的状态并添加到好友列表。
 * @param userToken: String (用户的登录令牌，用于标识当前用户。)
 * @param friendID: String (好友的用户ID，用于标识请求的目标用户。)
 * @return result: String (操作结果的返回信息，例如'好友请求已接受！')
 */

case class AcceptFriendRequestMessage(
  userToken: String,
  friendID: String
) extends API[String](UserServiceCode)



case object AcceptFriendRequestMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[AcceptFriendRequestMessage] = deriveEncoder
  private val circeDecoder: Decoder[AcceptFriendRequestMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[AcceptFriendRequestMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[AcceptFriendRequestMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[AcceptFriendRequestMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given acceptFriendRequestMessageEncoder: Encoder[AcceptFriendRequestMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given acceptFriendRequestMessageDecoder: Decoder[AcceptFriendRequestMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

