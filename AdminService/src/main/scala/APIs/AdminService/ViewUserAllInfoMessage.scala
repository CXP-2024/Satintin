package APIs.AdminService

import Common.API.API
import Global.ServiceCenter.AdminServiceCode

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

// 定义完整的用户信息结构
case class UserAllInfo(
  userID: String,
  username: String,
  banDays: Int,
  isOnline: Boolean,
  stoneAmount: Int
)

/**
 * ViewUserAllInfoMessage
 * desc: 管理员查看用户完整信息，包括基本信息和资产状态
 * @param adminToken: String (管理员身份令牌，用于验证权限)
 * @param userID: String (要查询的用户ID，可选，为空则返回所有用户)
 * @return userAllInfo: String (用户完整信息列表的JSON字符串)
 */
case class ViewUserAllInfoMessage(
  adminToken: String,
  userID: String = "" // 空字符串表示查询所有用户
) extends API[String](AdminServiceCode)

case object ViewUserAllInfoMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // UserAllInfo 的编码器和解码器
  given Encoder[UserAllInfo] = deriveEncoder
  given Decoder[UserAllInfo] = deriveDecoder

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[ViewUserAllInfoMessage] = deriveEncoder
  private val circeDecoder: Decoder[ViewUserAllInfoMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ViewUserAllInfoMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[ViewUserAllInfoMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ViewUserAllInfoMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }

  // Circe + Jackson 兜底的 Encoder
  given viewUserAllInfoMessageEncoder: Encoder[ViewUserAllInfoMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given viewUserAllInfoMessageDecoder: Decoder[ViewUserAllInfoMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
}