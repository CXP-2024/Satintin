package APIs.QuotaService

import Common.API.API
import Global.ServiceCenter.QuotaServiceCode

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
import Objects.BookService.BookCategory

/**
 * CheckUserQuotaMessage
 * desc: 检查用户配额是否满足借书条件，用于借书流程
 * @param userToken: String (用户的身份验证令牌，用于获取userID)
 * @param category: BookCategory:1041 (图书的类别信息)
 * @return result: String (操作结果字符串，可能为‘允许借书’或‘配额不足’)
 */

case class CheckUserQuotaMessage(
  userToken: String,
  category: BookCategory
) extends API[String](QuotaServiceCode)



case object CheckUserQuotaMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[CheckUserQuotaMessage] = deriveEncoder
  private val circeDecoder: Decoder[CheckUserQuotaMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[CheckUserQuotaMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[CheckUserQuotaMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[CheckUserQuotaMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given checkUserQuotaMessageEncoder: Encoder[CheckUserQuotaMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given checkUserQuotaMessageDecoder: Decoder[CheckUserQuotaMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

