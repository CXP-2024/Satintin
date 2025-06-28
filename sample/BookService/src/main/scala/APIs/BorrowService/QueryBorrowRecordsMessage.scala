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
import Objects.BookService.Book

/**
 * QueryBorrowRecordsMessage
 * desc: 查询借书记录
 * @param userToken: String (用户的Token，用于验证用户身份及权限)
 * @return records: Book (借书记录列表，每个记录包含借阅相关的详细信息)
 */

case class QueryBorrowRecordsMessage(
  userToken: String
) extends API[List[Book]](BorrowServiceCode)



case object QueryBorrowRecordsMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[QueryBorrowRecordsMessage] = deriveEncoder
  private val circeDecoder: Decoder[QueryBorrowRecordsMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[QueryBorrowRecordsMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[QueryBorrowRecordsMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[QueryBorrowRecordsMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given queryBorrowRecordsMessageEncoder: Encoder[QueryBorrowRecordsMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given queryBorrowRecordsMessageDecoder: Decoder[QueryBorrowRecordsMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

