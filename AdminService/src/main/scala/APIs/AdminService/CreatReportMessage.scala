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
 * CreatReportMessage
 * desc: 用户提交举报记录，报告违规行为或作弊行为
 * @param userToken: String (举报人的用户Token，用于身份验证)
 * @param reportedUserID: String (被举报用户的ID)
 * @param reportReason: String (举报的具体原因，例如"使用外挂"、"恶意行为"等)
 * @return result: String (举报提交结果，包含举报ID或成功信息)
 */

case class CreatReportMessage(
  userToken: String,
  reportedUserID: String,
  reportReason: String
) extends API[String](AdminServiceCode)



case object CreatReportMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[CreatReportMessage] = deriveEncoder
  private val circeDecoder: Decoder[CreatReportMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[CreatReportMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[CreatReportMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[CreatReportMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given creatReportMessageEncoder: Encoder[CreatReportMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given creatReportMessageDecoder: Decoder[CreatReportMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}