package APIs.BookService

import Common.API.API
import Global.ServiceCenter.BookServiceCode

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
 * AddBookMessage
 * desc: 添加图书记录
 * @param adminToken: String (管理员的凭证Token，用于验证权限)
 * @param title: String (图书的书名)
 * @param author: String (图书的作者)
 * @param category: BookCategory:1041 (图书的类别)
 * @param totalCopies: Int (图书的总数量)
 * @return bookID: String (生成的图书唯一标识ID)
 */

case class AddBookMessage(
  adminToken: String,
  title: String,
  author: String,
  category: BookCategory,
  totalCopies: Int
) extends API[String](BookServiceCode)



case object AddBookMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[AddBookMessage] = deriveEncoder
  private val circeDecoder: Decoder[AddBookMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[AddBookMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[AddBookMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[AddBookMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given addBookMessageEncoder: Encoder[AddBookMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given addBookMessageDecoder: Decoder[AddBookMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

