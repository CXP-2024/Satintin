package APIs.BorrowService

import Common.API.API
import Global.ServiceCenter.BorrowServiceCode

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
 * RenewBookMessage
 * desc: 用于延长借阅期限的续借操作。
 * @param userToken: String (用户身份认证Token，用于验证用户身份。)
 * @param recordID: String (借书记录的唯一标识符。)
 * @return result: String (续借操作结果的字符串描述，例如“续借成功”或失败信息。)
 */

case class RenewBookMessage(
  userToken: String,
  recordID: String
) extends API[String](BorrowServiceCode)



case object RenewBookMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[RenewBookMessage] = deriveEncoder
  private val circeDecoder: Decoder[RenewBookMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[RenewBookMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[RenewBookMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[RenewBookMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given renewBookMessageEncoder: Encoder[RenewBookMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given renewBookMessageDecoder: Decoder[RenewBookMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

