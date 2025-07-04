package APIs.UserService

import Common.API.API
import Global.ServiceCenter.UserServiceCode
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils
import scala.util.Try
import org.joda.time.DateTime
import java.util.UUID
import Objects.UserService.User

/**
 * FetchUserStatusMessage
 * desc: 根据用户ID获取用户的完整状态信息，包括基础信息、社交信息和资产信息。
 * @param userID 目标用户的唯一标识ID
 * @return user 完整的用户状态信息，如果用户不存在则返回None
 */
case class FetchUserStatusMessage(
  userID: String
) extends API[Option[User]](UserServiceCode)

case object FetchUserStatusMessage {
  import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[FetchUserStatusMessage] = deriveEncoder
  private val circeDecoder: Decoder[FetchUserStatusMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[FetchUserStatusMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }
  
  private val jacksonDecoder: Decoder[FetchUserStatusMessage] = Decoder.instance { cursor =>
    try { 
      Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[FetchUserStatusMessage]() {})) 
    } catch { 
      case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) 
    }
  }

  // Circe + Jackson 兜底的 Encoder
  given fetchUserStatusMessageEncoder: Encoder[FetchUserStatusMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given fetchUserStatusMessageDecoder: Decoder[FetchUserStatusMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
}