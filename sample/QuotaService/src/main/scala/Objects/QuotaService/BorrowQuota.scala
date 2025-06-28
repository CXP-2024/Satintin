package Objects.QuotaService


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
 * BorrowQuota
 * desc: 用户借阅配额信息
 * @param userID: String (用户ID)
 * @param category: BookCategory:1041 (借阅图书的分类)
 * @param currentQuota: Int (当前已经借阅的数量)
 * @param maxQuota: Int (最大可借阅数量)
 */

case class BorrowQuota(
  userID: String,
  category: BookCategory,
  currentQuota: Int,
  maxQuota: Int
){

  //process class code 预留标志位，不要删除


}


case object BorrowQuota{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[BorrowQuota] = deriveEncoder
  private val circeDecoder: Decoder[BorrowQuota] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[BorrowQuota] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[BorrowQuota] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[BorrowQuota]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given borrowQuotaEncoder: Encoder[BorrowQuota] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given borrowQuotaDecoder: Decoder[BorrowQuota] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

