package Objects.AdminService


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
 * CheatingReport
 * desc: 举报信息，包含举报的用户、被举报的用户及相关详情。
 * @param reportID: String (举报的唯一ID)
 * @param reportingUserID: String (举报发起者的用户ID)
 * @param reportedUserID: String (被举报的用户ID)
 * @param reportReason: String (举报的原因)
 * @param isResolved: Boolean (举报是否已经解决)
 * @param reportTime: DateTime (举报提交的时间)
 */

case class CheatingReport(
  reportID: String,
  reportingUserID: String,
  reportedUserID: String,
  reportReason: String,
  isResolved: Boolean,
  reportTime: DateTime
){

  //process class code 预留标志位，不要删除


}


case object CheatingReport{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[CheatingReport] = deriveEncoder
  private val circeDecoder: Decoder[CheatingReport] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[CheatingReport] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[CheatingReport] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[CheatingReport]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given cheatingReportEncoder: Encoder[CheatingReport] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given cheatingReportDecoder: Decoder[CheatingReport] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

