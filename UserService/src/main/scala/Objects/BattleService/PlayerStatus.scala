package Objects.BattleService


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
import Objects.BattleService.ActionEntry
import Objects.CardService.CardEntry

/**
 * PlayerStatus
 * desc: 玩家状态，包含血量、能量、行动信息及未使用的卡牌
 * @param health: Int (玩家的血量)
 * @param energy: Int (玩家的能量)
 * @param actions: ActionEntry (玩家的行动信息)
 * @param unusedCards: CardEntry:1124 (玩家未使用的卡牌)
 */

case class PlayerStatus(
  health: Int,
  energy: Int,
  actions: List[ActionEntry],
  unusedCards: List[CardEntry]
){

  //process class code 预留标志位，不要删除


}


case object PlayerStatus{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[PlayerStatus] = deriveEncoder
  private val circeDecoder: Decoder[PlayerStatus] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[PlayerStatus] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[PlayerStatus] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[PlayerStatus]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given playerStatusEncoder: Encoder[PlayerStatus] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given playerStatusDecoder: Decoder[PlayerStatus] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

