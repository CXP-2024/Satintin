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
 * ManageReportMessage
 * desc: 管理员处理举报记录并更新举报状态
 * @param adminToken: String (管理员登录凭证，用于验证其权限。)
 * @param reportID: String (需要处理的举报记录ID。)
 * @param resolutionStatus: String (举报处理结果状态，例如'已处理'或'未处理'。)
 * @return result: String (处理操作的结果字符串，表示是否成功完成。)
 */

case class ManageReportMessage(
  adminToken: String,
  reportID: String,
  resolutionStatus: String
) extends API[String](AdminServiceCode)



case object ManageReportMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[ManageReportMessage] = deriveEncoder
  private val circeDecoder: Decoder[ManageReportMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ManageReportMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[ManageReportMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ManageReportMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given manageReportMessageEncoder: Encoder[ManageReportMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given manageReportMessageDecoder: Decoder[ManageReportMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

