package APIs.BattleService

import Common.API.API
import Global.ServiceCenter.BattleServiceCode

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
 * SubmitPlayerActionMessage
 * desc: 根据房间ID记录玩家的行动类型及相关信息，用于处理玩家行动的需求。
 * @param userToken: String (用户的鉴权Token，用于确认用户身份)
 * @param roomID: String (目标房间的唯一标识符)
 * @param actionType: String (用户行为类型，例如撒、饼、防)
 * @param targetID: String (可选的目标玩家ID，只有部分行为需要用到此参数)
 * @return result: String (行为提交结果，例如 '行动已提交！')
 */

case class SubmitPlayerActionMessage(
  userToken: String,
  roomID: String,
  actionType: String,
  targetID: Option[String] = None
) extends API[String](BattleServiceCode)



case object SubmitPlayerActionMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[SubmitPlayerActionMessage] = deriveEncoder
  private val circeDecoder: Decoder[SubmitPlayerActionMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[SubmitPlayerActionMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[SubmitPlayerActionMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[SubmitPlayerActionMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given submitPlayerActionMessageEncoder: Encoder[SubmitPlayerActionMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given submitPlayerActionMessageDecoder: Decoder[SubmitPlayerActionMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

