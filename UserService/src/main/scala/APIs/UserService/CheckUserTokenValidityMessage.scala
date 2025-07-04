package APIs.UserService

import Common.API.API
import Global.ServiceCenter.UserServiceCode
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*

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
    cursor.as[String].flatMap { jsonString =>
      parse(jsonString).flatMap(_.as[CheckUserTokenValidityMessage](circeDecoder))
    }
  }

  // 根据序列化类型选择对应的 Encoder 和 Decoder
  given encoder: Encoder[CheckUserTokenValidityMessage] = Common.Serialize.CommonColumnTypes.getEncoder(circeEncoder, jacksonEncoder)
  given decoder: Decoder[CheckUserTokenValidityMessage] = Common.Serialize.CommonColumnTypes.getDecoder(circeDecoder, jacksonDecoder)
}