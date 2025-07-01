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
 * CreateBattleRoomMessage
 * desc: 创建一个新的对战房间，并返回房间ID。用于处理创建对战房间的需求。
 * @param userToken: String (用户认证令牌，用于验证用户合法性。)
 * @return roomID: String (生成的对战房间ID。)
 */

case class CreateBattleRoomMessage(
  userToken: String
) extends API[String](BattleServiceCode)



case object CreateBattleRoomMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[CreateBattleRoomMessage] = deriveEncoder
  private val circeDecoder: Decoder[CreateBattleRoomMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[CreateBattleRoomMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[CreateBattleRoomMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[CreateBattleRoomMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given createBattleRoomMessageEncoder: Encoder[CreateBattleRoomMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given createBattleRoomMessageDecoder: Decoder[CreateBattleRoomMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

