package Objects.BorrowService


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
 * BorrowRecord
 * desc: 借阅记录信息
 * @param recordID: String (记录的唯一ID)
 * @param userID: String (用户ID)
 * @param bookID: String (图书的唯一ID)
 * @param borrowedAt: DateTime (借阅时间)
 * @param dueAt: DateTime (应还时间)
 * @param returnedAt: DateTime (归还时间，如果未归还则为空)
 * @param renewalCount: Int (续借次数)
 */

case class BorrowRecord(
  recordID: String,
  userID: String,
  bookID: String,
  borrowedAt: DateTime,
  dueAt: DateTime,
  returnedAt: Option[DateTime] = None,
  renewalCount: Int = 0
){

  //process class code 预留标志位，不要删除


}


case object BorrowRecord{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[BorrowRecord] = deriveEncoder
  private val circeDecoder: Decoder[BorrowRecord] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[BorrowRecord] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[BorrowRecord] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[BorrowRecord]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given borrowRecordEncoder: Encoder[BorrowRecord] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given borrowRecordDecoder: Decoder[BorrowRecord] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

