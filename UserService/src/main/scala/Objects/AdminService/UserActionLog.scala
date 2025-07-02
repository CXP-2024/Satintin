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
 * UserActionLog
 * desc: 用户行为日志信息
 * @param actionLogID: String (日志的唯一标识符)
 * @param userID: String (对应用户的唯一标识符)
 * @param actionType: String (用户行为的类型)
 * @param actionDetail: String (具体的行为详细描述)
 * @param actionTime: DateTime (行为的时间戳)
 */

case class UserActionLog(
  actionLogID: String,
  userID: String,
  actionType: String,
  actionDetail: String,
  actionTime: DateTime
){

  //process class code 预留标志位，不要删除


}


case object UserActionLog{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[UserActionLog] = deriveEncoder
  private val circeDecoder: Decoder[UserActionLog] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[UserActionLog] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[UserActionLog] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[UserActionLog]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given userActionLogEncoder: Encoder[UserActionLog] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given userActionLogDecoder: Decoder[UserActionLog] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

