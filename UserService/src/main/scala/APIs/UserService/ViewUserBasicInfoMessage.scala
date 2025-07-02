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

// 定义返回的用户基本信息结构
case class UserBasicInfo(
  userID: String,
  username: String,
  banDays: Int,
  isOnline: Boolean
)

// UserBasicInfo 的编码器和解码器需要在使用前定义
object UserBasicInfo {
  given Encoder[UserBasicInfo] = deriveEncoder
  given Decoder[UserBasicInfo] = deriveDecoder
}

/**
 * ViewUserBasicInfoMessage
 * desc: 查询用户基本信息（用户名、ID、封禁天数、在线状态）
 * @param userID: String (要查询的用户ID，可选，为空则返回所有用户)
 * @return userInfo: String (用户基本信息列表的JSON字符串)
 */
case class ViewUserBasicInfoMessage(
  userID: String = "" // 空字符串表示查询所有用户
) extends API[String](UserServiceCode) // 改为String类型

case object ViewUserBasicInfoMessage {
  
  import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

  // UserBasicInfo 的编码器和解码器
  given Encoder[UserBasicInfo] = deriveEncoder
  given Decoder[UserBasicInfo] = deriveDecoder

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[ViewUserBasicInfoMessage] = deriveEncoder
  private val circeDecoder: Decoder[ViewUserBasicInfoMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ViewUserBasicInfoMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[ViewUserBasicInfoMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ViewUserBasicInfoMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }

  // Circe + Jackson 兜底的 Encoder
  given viewUserBasicInfoMessageEncoder: Encoder[ViewUserBasicInfoMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given viewUserBasicInfoMessageDecoder: Decoder[ViewUserBasicInfoMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
}