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
 * ModifyUserInfoMessage
 * desc: 根据传入的用户ID及需要修改的字段，更新用户信息。
 * @param userToken: String (用户登录的身份标识，用于权限验证。)
 * @param userID: String (需要修改信息的用户ID。)
 * @param keys: String (待修改字段的名称列表，例如邮箱、用户名。)
 * @param values: String (待修改字段的新值列表，与keys顺序对应。)
 * @return result: String (接口返回的操作结果信息，例如“修改成功！”)
 */

case class ModifyUserInfoMessage(
  userToken: String,
  userID: String,
  keys: List[String],
  values: List[String]
) extends API[String](UserServiceCode)



case object ModifyUserInfoMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[ModifyUserInfoMessage] = deriveEncoder
  private val circeDecoder: Decoder[ModifyUserInfoMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ModifyUserInfoMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[ModifyUserInfoMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ModifyUserInfoMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given modifyUserInfoMessageEncoder: Encoder[ModifyUserInfoMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given modifyUserInfoMessageDecoder: Decoder[ModifyUserInfoMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

