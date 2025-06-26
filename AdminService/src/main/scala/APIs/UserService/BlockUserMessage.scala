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
 * BlockUserMessage
 * desc: 将目标用户ID加入当前用户的黑名单列表。
 * @param userToken: String (用户的身份验证令牌，用于识别当前用户。)
 * @param blackUserID: String (需要加入黑名单的目标用户ID。)
 * @return result: String (操作结果字符串，指示黑名单加入操作是否成功。)
 */

case class BlockUserMessage(
  userToken: String,
  blackUserID: String
) extends API[String](UserServiceCode)



case object BlockUserMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[BlockUserMessage] = deriveEncoder
  private val circeDecoder: Decoder[BlockUserMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[BlockUserMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[BlockUserMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[BlockUserMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given blockUserMessageEncoder: Encoder[BlockUserMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given blockUserMessageDecoder: Decoder[BlockUserMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

