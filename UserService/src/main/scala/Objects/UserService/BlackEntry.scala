package Objects.UserService


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
 * BlackEntry
 * desc: 黑名单条目信息
 * @param blackUserID: String (被加入黑名单的用户ID)
 */

case class BlackEntry(
  blackUserID: String
){

  //process class code 预留标志位，不要删除


}


case object BlackEntry{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[BlackEntry] = deriveEncoder
  private val circeDecoder: Decoder[BlackEntry] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[BlackEntry] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[BlackEntry] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[BlackEntry]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given blackEntryEncoder: Encoder[BlackEntry] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given blackEntryDecoder: Decoder[BlackEntry] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

