package APIs.UserService

import Common.API.API
import Global.ServiceCenter.UserServiceCode
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*

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
    cursor.as[String].flatMap { jsonString =>
      parse(jsonString).flatMap(_.as[ValidateUserTokenMessage](circeDecoder))
    }
  }

  // 根据序列化类型选择对应的 Encoder 和 Decoder
  given encoder: Encoder[ValidateUserTokenMessage] = Common.Serialize.CommonColumnTypes.getEncoder(circeEncoder, jacksonEncoder)
  given decoder: Decoder[ValidateUserTokenMessage] = Common.Serialize.CommonColumnTypes.getDecoder(circeDecoder, jacksonDecoder)
}