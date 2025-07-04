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
 * SystemStats
 * desc: 系统统计信息
 * @param activeUserCount: Int (当前活跃用户数)
 * @param totalMatches: Int (总匹配场次)
 * @param totalCardDraws: Int (总抽卡次数)
 * @param totalReports: Int (总举报次数)
 * @param snapshotTime: DateTime (统计数据快照时间)
 */

case class SystemStats(
  activeUserCount: Int,
  totalMatches: Int,
  totalCardDraws: Int,
  totalReports: Int,
  snapshotTime: DateTime
){

  //process class code 预留标志位，不要删除


}


case object SystemStats{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[SystemStats] = deriveEncoder
  private val circeDecoder: Decoder[SystemStats] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[SystemStats] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[SystemStats] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[SystemStats]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given systemStatsEncoder: Encoder[SystemStats] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given systemStatsDecoder: Decoder[SystemStats] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

