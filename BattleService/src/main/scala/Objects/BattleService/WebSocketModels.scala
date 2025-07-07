package Objects.BattleService

import Objects.BattleService.core._
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax._
import org.joda.time.DateTime

/**
 * Models for WebSocket communication
 */

/**
 * Battle action (饼、防、撒)
 */
case class BattleAction(
  Action: Either[PassiveAction, ActiveAction],
  playerId: String,
  timestamp: Long
)

object BattleAction {
  // 为 Either[PassiveAction, ActiveAction] 创建编码器
  implicit val eitherActionEncoder: Encoder[Either[PassiveAction, ActiveAction]] = {
    Encoder.instance {
      case Left(passive) => Json.obj("isLeft" -> Json.True, "value" -> passive.asJson)
      case Right(active) => Json.obj("isLeft" -> Json.False, "value" -> active.asJson)
    }
  }

  // 为 Either[PassiveAction, ActiveAction] 创建解码器
  implicit val eitherActionDecoder: Decoder[Either[PassiveAction, ActiveAction]] = {
    Decoder.instance { cursor =>
      cursor.downField("isLeft").as[Boolean].flatMap { isLeft =>
        val valueCursor = cursor.downField("value")
        if (isLeft) {
          valueCursor.as[PassiveAction].map(Left(_))
        } else {
          valueCursor.as[ActiveAction].map(Right(_))
        }
      }
    }
  }

  // 现在可以使用这些编码器和解码器来派生BattleAction的编码器和解码器
  implicit val encoder: Encoder[BattleAction] = deriveEncoder
  implicit val decoder: Decoder[BattleAction] = deriveDecoder
}

/**
 * Card state in battle
 */
case class CardState(
  cardId: String,
  name: String,
  `type`: String,  // "penetrate" (穿透), "develop" (发育), "reflect" (反弹)
  rarity: String,  // "common" (普通), "rare" (稀有), "legendary" (传说)
  effectChance: Double
)

object CardState {
  implicit val encoder: Encoder[CardState] = deriveEncoder
  implicit val decoder: Decoder[CardState] = deriveDecoder
}

/**
 * Player state in battle
 */
case class PlayerState(
  playerId: String,
  username: String,
  health: Int,
  energy: Int,
  rank: String,
  cards: List[CardState],
  isReady: Boolean = false,
  currentAction: Option[BattleAction] = None, // 当前采取的行动
  isConnected: Boolean = true,  // 是否在线
  remainingTime: Int = 60, // 剩余时间（秒）, 默认30秒, 采取行动之后时间暂停
  hasActed: Boolean = false // 是否已经采取行动
) {
  // 必要的辅助方法
  
  // 处理受到伤害
  def takeDamage(damage: Int): PlayerState = copy(health = health - damage)
  
  // 清空能量
  def clearEnergy(): PlayerState = copy(energy = 0)
  
  // 检查是否会爆点
  def wouldExplode: Boolean = currentAction match {
    case Some(BattleAction(Right(activeAction), _, _)) => energy < activeAction.getTotalEnergyCost
    case _ => false
  }
  
  // 清除行动
  def clearAction(): PlayerState = copy(currentAction = None)
}

object PlayerState {
  implicit val encoder: Encoder[PlayerState] = deriveEncoder
  implicit val decoder: Decoder[PlayerState] = deriveDecoder
}

/**
 * Game state
 */
case class GameState(
  roomId: String,
  player1: PlayerState,
  player2: PlayerState,
  currentRound: Int,
  roundPhase: String,  // "waiting", "action", "result", "finished"
  winner: Option[String] = None
) {
  // 获取指定玩家
  def getPlayer(playerId: String): Option[PlayerState] = {
    if (player1.playerId == playerId) Some(player1)
    else if (player2.playerId == playerId) Some(player2)
    else None
  }
  
  // 更新玩家状态
  def updatePlayer(playerId: String, newState: PlayerState): GameState = {
    if (player1.playerId == playerId) copy(player1 = newState)
    else if (player2.playerId == playerId) copy(player2 = newState)
    else this
  }
}

object GameState {
  implicit val encoder: Encoder[GameState] = deriveEncoder
  implicit val decoder: Decoder[GameState] = deriveDecoder
}

/**
 * Card effect in battle
 */
case class CardEffect(
  playerId: String,
  cardName: String,
  effectType: String,  // "penetrate", "develop", "reflect"
  triggered: Boolean
)

object CardEffect {
  implicit val encoder: Encoder[CardEffect] = deriveEncoder
  implicit val decoder: Decoder[CardEffect] = deriveDecoder
}

/**
 * Round result
 */
case class RoundResult(
  round: Int,
  player1Action: BattleAction,
  player2Action: BattleAction,
  results: Json,  // Contains health and energy changes
  cardEffects: List[CardEffect]
)

object RoundResult {
  implicit val encoder: Encoder[RoundResult] = deriveEncoder
  implicit val decoder: Decoder[RoundResult] = deriveDecoder
}

/**
 * Game over result
 */
case class GameOverResult(
  winner: String,
  reason: String,  // "health_zero", "disconnect", "surrender"
  rewards: Option[Json] = None  // Optional rewards like stones and rank changes
)

object GameOverResult {
  implicit val encoder: Encoder[GameOverResult] = deriveEncoder
  implicit val decoder: Decoder[GameOverResult] = deriveDecoder
}

/**
 * Player joined event
 */
case class PlayerJoinedEvent(
  playerId: String,
  username: String
)

object PlayerJoinedEvent {
  implicit val encoder: Encoder[PlayerJoinedEvent] = deriveEncoder
  implicit val decoder: Decoder[PlayerJoinedEvent] = deriveDecoder
}

/**
 * Player left event
 */
case class PlayerLeftEvent(
  playerId: String
)

object PlayerLeftEvent {
  implicit val encoder: Encoder[PlayerLeftEvent] = deriveEncoder
  implicit val decoder: Decoder[PlayerLeftEvent] = deriveDecoder
}

/**
 * WebSocket message wrapper
 */
case class WebSocketMessage(
  `type`: String,
  data: Json
)

object WebSocketMessage {
  implicit val encoder: Encoder[WebSocketMessage] = deriveEncoder
  implicit val decoder: Decoder[WebSocketMessage] = deriveDecoder
}