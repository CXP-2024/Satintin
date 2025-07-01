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
import Objects.BattleService.BattleState

/**
 * BattleRoom
 * desc: 表示战斗房间的主要信息
 * @param roomID: String (房间的唯一标识)
 * @param playerOneID: String (玩家一的唯一标识)
 * @param playerTwoID: String (玩家二的唯一标识)
 * @param ownerID: String (房间主人的唯一标识)
 * @param currentTurnPlayer: String (当前轮到操作的玩家ID)
 * @param battleState: BattleState:1034 (战斗状态对象)
 * @param winnerID: String (获胜玩家的唯一标识)
 * @param createTime: DateTime (房间的创建时间)
 */

case class BattleRoom(
  roomID: String,
  playerOneID: String,
  playerTwoID: String,
  ownerID: String,
  currentTurnPlayer: String,
  battleState: BattleState,
  winnerID: String,
  createTime: DateTime
){

  //process class code 预留标志位，不要删除


}


case object BattleRoom{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[BattleRoom] = deriveEncoder
  private val circeDecoder: Decoder[BattleRoom] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[BattleRoom] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[BattleRoom] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[BattleRoom]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given battleRoomEncoder: Encoder[BattleRoom] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given battleRoomDecoder: Decoder[BattleRoom] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

