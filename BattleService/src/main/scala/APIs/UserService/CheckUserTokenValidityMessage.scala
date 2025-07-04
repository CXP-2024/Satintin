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
 * 检查用户Token有效性的API
 * @param userToken 用户登录Token
 * @return isValid Token是否有效
 */
case class CheckUserTokenValidityMessage(
  userToken: String
) extends API[Boolean](UserServiceCode)

case object CheckUserTokenValidityMessage {
  import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[CheckUserTokenValidityMessage] = deriveEncoder
  private val circeDecoder: Decoder[CheckUserTokenValidityMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[CheckUserTokenValidityMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }
  private val jacksonDecoder: Decoder[CheckUserTokenValidityMessage] = Decoder.instance { cursor =>
    try { 
      Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[CheckUserTokenValidityMessage]() {})) 
    } catch { 
      case e: Throwable => Left(DecodingFailure(e.getMessage, cursor.history)) 
    }
  }

  // Circe + Jackson 兜底的 Encoder
  given checkUserTokenValidityMessageEncoder: Encoder[CheckUserTokenValidityMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given checkUserTokenValidityMessageDecoder: Decoder[CheckUserTokenValidityMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
}