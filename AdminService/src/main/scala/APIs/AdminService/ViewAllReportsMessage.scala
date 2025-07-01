package APIs.AdminService

import Common.API.API
import Global.ServiceCenter.AdminServiceCode
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax._
import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils
import scala.util.Try

/**
 * ViewAllReportsMessage
 * desc: 管理员查看所有举报记录
 * @param adminToken: String (管理员登录凭证，用于验证其权限)
 * @return result: List[CheatingReport] (所有举报记录的列表)
 */
case class ViewAllReportsMessage(
  adminToken: String
) extends API[String](AdminServiceCode)

case object ViewAllReportsMessage {
  import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[ViewAllReportsMessage] = deriveEncoder
  private val circeDecoder: Decoder[ViewAllReportsMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ViewAllReportsMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[ViewAllReportsMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ViewAllReportsMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given viewAllReportsMessageEncoder: Encoder[ViewAllReportsMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given viewAllReportsMessageDecoder: Decoder[ViewAllReportsMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }

  //process object code 预留标志位，不要删除
}