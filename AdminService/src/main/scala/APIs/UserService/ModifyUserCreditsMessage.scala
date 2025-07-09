package APIs.UserService

import Common.API.API
import Global.ServiceCenter.UserServiceCode

import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*

import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils

import scala.util.Try

/**
 * ModifyUserCreditsMessage
 * desc: 修改用户的积分，并自动更新对应的段位信息
 * @param userID: String (需要修改积分的用户ID)
 * @param targetCredits: Int (目标积分值，必须大于等于0)
 * @return result: String (接口返回的操作结果信息，例如"积分更新成功")
 */

case class ModifyUserCreditsMessage(
  userID: String,
  targetCredits: Int
) extends API[String](UserServiceCode)

case object ModifyUserCreditsMessage {
  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[ModifyUserCreditsMessage] = deriveEncoder
  private val circeDecoder: Decoder[ModifyUserCreditsMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ModifyUserCreditsMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[ModifyUserCreditsMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ModifyUserCreditsMessage]() {})) }
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }

  // Circe + Jackson 兜底的 Encoder
  given modifyUserCreditsMessageEncoder: Encoder[ModifyUserCreditsMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given modifyUserCreditsMessageDecoder: Decoder[ModifyUserCreditsMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
} 