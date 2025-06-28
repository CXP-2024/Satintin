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
 * UpdateBookInfoMessage
 * desc: 更新图书记录，用于修改图书信息
 * @param adminToken: String (管理员的身份Token，用于验证管理员权限)
 * @param bookID: String (图书的唯一标识符)
 * @param title: String (图书名称，支持Option类型更新)
 * @param author: String (图书作者，支持Option类型更新)
 * @param category: BookCategory:1041 (图书类别，支持Option类型更新)
 * @param totalCopies: Int (图书库存总量，支持Option类型更新)
 * @return result: String (操作结果字符串，表示更新的状态结果)
 */

case class UpdateBookInfoMessage(
  adminToken: String,
  bookID: String,
  title: Option[String] = None,
  author: Option[String] = None,
  category: Option[BookCategory] = None,
  totalCopies: Option[Int] = None
) extends API[String](BookServiceCode)



case object UpdateBookInfoMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[UpdateBookInfoMessage] = deriveEncoder
  private val circeDecoder: Decoder[UpdateBookInfoMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[UpdateBookInfoMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[UpdateBookInfoMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[UpdateBookInfoMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given updateBookInfoMessageEncoder: Encoder[UpdateBookInfoMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given updateBookInfoMessageDecoder: Decoder[UpdateBookInfoMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

