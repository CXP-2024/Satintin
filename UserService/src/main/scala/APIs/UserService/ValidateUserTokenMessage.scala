package APIs.UserService

import Common.API.API
import Common.Serialize.JacksonSerializeUtils
import Global.ServiceCenter.UserServiceCode
import io.circe.{Decoder, Encoder, Json, DecodingFailure}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import com.fasterxml.jackson.core.`type`.TypeReference
import scala.util.Try

/**
 * 验证用户Token并获取用户ID的API
 * @param userToken 用户登录Token
 * @return userID 对应的用户ID
 */
case class ValidateUserTokenMessage(
  userToken: String
) extends API[String](UserServiceCode)

case object ValidateUserTokenMessage {
  import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[ValidateUserTokenMessage] = deriveEncoder
  private val circeDecoder: Decoder[ValidateUserTokenMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ValidateUserTokenMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }
  private val jacksonDecoder: Decoder[ValidateUserTokenMessage] = Decoder.instance { cursor =>
    try { 
      Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ValidateUserTokenMessage]() {})) 
    } catch { 
      case e: Throwable => Left(DecodingFailure(e.getMessage, cursor.history)) 
    }
  }

  // Circe + Jackson 兜底的 Encoder
  given validateUserTokenMessageEncoder: Encoder[ValidateUserTokenMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given validateUserTokenMessageDecoder: Decoder[ValidateUserTokenMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
}