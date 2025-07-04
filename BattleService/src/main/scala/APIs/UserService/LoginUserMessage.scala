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
 * LoginUserMessage
 * desc: 验证用户名和密码哈希是否正确。如果正确，返回包含用户ID和usertoken的JSON字符串。
 * @param username: String (用户名，用于登录时的身份验证。)
 * @param passwordHash: String (用户密码的哈希值，用于与数据库中的存储值进行比对。)
 * @return loginResult: String (包含用户ID和userToken的JSON字符串)
 */

case class LoginUserMessage(
  username: String,
  passwordHash: String
) extends API[String](UserServiceCode)

case object LoginUserMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[LoginUserMessage] = deriveEncoder
  private val circeDecoder: Decoder[LoginUserMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[LoginUserMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[LoginUserMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[LoginUserMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given loginUserMessageEncoder: Encoder[LoginUserMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder  
  given loginUserMessageDecoder: Decoder[LoginUserMessage] = Decoder.instance { cursor =>
    circeDecoder.decodeJson(cursor.value) match {
      case Right(result) => Right(result)
      case Left(_) => jacksonDecoder.decodeJson(cursor.value)
    }
  }
}

