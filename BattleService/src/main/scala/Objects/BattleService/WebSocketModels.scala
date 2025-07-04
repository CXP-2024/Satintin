package Objects.BattleService

import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import org.joda.time.DateTime

/**
 * Models for WebSocket communication
 */

/**
 * Battle action (饼、防、撒)
 */
case class BattleAction(
  `type`: String,  // "cake" (饼), "defense" (防), "spray" (撒)
  playerId: String,
  timestamp: Long
)

object BattleAction {
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
  hasActed: Boolean = false, // 是否已经采取行动
)

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
  player2: PlayerState, // add remaining time for each player
  currentRound: Int,
  roundPhase: String,  // "waiting", "action", "result", "finished"
  winner: Option[String] = None
)

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