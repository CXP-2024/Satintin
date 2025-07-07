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
import Objects.BattleService.PlayerStatus

/**
 * BattleState
 * desc: 战斗状态信息，包括当前轮次、阶段和玩家状态等内容
//  * @param currentRound: Int (当前的轮次)
 * @param roundPhase: String (当前轮的阶段)
 * @param remainingTime: Int (当前阶段剩余时间)
 * @param playerOneStatus: PlayerStatus (一号玩家的状态信息)
 * @param playerTwoStatus: PlayerStatus:1092 (二号玩家的状态信息)
 */

case class BattleState(
  currentRound: Int,
  roundPhase: String,
  remainingTime: Int,
  playerOneStatus: PlayerStatus,
  playerTwoStatus: PlayerStatus
){

  //process class code 预留标志位，不要删除


}


case object BattleState{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[BattleState] = deriveEncoder
  private val circeDecoder: Decoder[BattleState] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[BattleState] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[BattleState] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[BattleState]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given battleStateEncoder: Encoder[BattleState] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given battleStateDecoder: Decoder[BattleState] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

