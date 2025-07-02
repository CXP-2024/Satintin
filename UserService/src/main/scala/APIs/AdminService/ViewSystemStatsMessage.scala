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
import Objects.AdminService.SystemStats

/**
 * ViewSystemStatsMessage
 * desc: 返回当前系统的运营数据统计，包含活跃用户数、对战次数等信息。
 * @param adminToken: String (管理员的身份令牌，用于鉴权操作。)
 * @return systemStats: SystemStats:1039 (系统统计数据，包括活跃用户数、对战次数、抽卡次数、举报总数等。)
 */

case class ViewSystemStatsMessage(
  adminToken: String
) extends API[SystemStats](AdminServiceCode)



case object ViewSystemStatsMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[ViewSystemStatsMessage] = deriveEncoder
  private val circeDecoder: Decoder[ViewSystemStatsMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ViewSystemStatsMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[ViewSystemStatsMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ViewSystemStatsMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given viewSystemStatsMessageEncoder: Encoder[ViewSystemStatsMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given viewSystemStatsMessageDecoder: Decoder[ViewSystemStatsMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

