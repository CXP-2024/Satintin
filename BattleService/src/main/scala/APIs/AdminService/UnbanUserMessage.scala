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


/**
 * UnbanUserMessage
 * desc: 根据用户ID取消其封禁状态，处理解封用户的需求。
 * @param adminToken: String (管理员身份Token，用于标识和验证管理员权限)
 * @param userID: String (需要解封的用户ID)
 * @return result: String (解封操作的结果信息，固定为'用户解封成功！')
 */

case class UnbanUserMessage(
  adminToken: String,
  userID: String
) extends API[String](AdminServiceCode)



case object UnbanUserMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[UnbanUserMessage] = deriveEncoder
  private val circeDecoder: Decoder[UnbanUserMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[UnbanUserMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[UnbanUserMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[UnbanUserMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given unbanUserMessageEncoder: Encoder[UnbanUserMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given unbanUserMessageDecoder: Decoder[UnbanUserMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

