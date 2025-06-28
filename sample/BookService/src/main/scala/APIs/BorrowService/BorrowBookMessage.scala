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
 * BorrowBookMessage
 * desc: 借书操作，用于记录借书行为
 * @param userToken: String (用户登录的Token，用于标识用户身份)
 * @param bookID: String (借阅的图书ID)
 * @return result: String (借书操作的结果信息，例如“借书成功”或错误信息)
 */

case class BorrowBookMessage(
  userToken: String,
  bookID: String
) extends API[String](BorrowServiceCode)



case object BorrowBookMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[BorrowBookMessage] = deriveEncoder
  private val circeDecoder: Decoder[BorrowBookMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[BorrowBookMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[BorrowBookMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[BorrowBookMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given borrowBookMessageEncoder: Encoder[BorrowBookMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given borrowBookMessageDecoder: Decoder[BorrowBookMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

