package Objects.BattleService

import Objects.BattleService.core._
import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}

// ==================== 回合结果 ====================

case class RoundResult(
  roundNumber: Int,
  player1Action: Option[Either[PassiveAction, ActiveAction]],
  player2Action: Option[Either[PassiveAction, ActiveAction]],
  player1DamageTaken: Int,
  player2DamageTaken: Int,
  player1EnergyChange: Int,
  player2EnergyChange: Int,
  explosionOccurred: Boolean,
  explodedPlayer: Option[String] = None
)

// ==================== 游戏状态 ====================

case class GameState(
  roomId: String,
  player1: PlayerState,
  player2: PlayerState,
  currentRound: Int = 1,
  gameStatus: GameStatus = GameStatus.InProgress,
  roundHistory: List[RoundResult] = List.empty,
  lastUpdated: Long = System.currentTimeMillis()
) {
  def getPlayer(playerId: String): Option[PlayerState] = {
    if (player1.playerId == playerId) Some(player1)
    else if (player2.playerId == playerId) Some(player2)
    else None
  }
  
  def updatePlayer(playerId: String, newState: PlayerState): GameState = {
    if (player1.playerId == playerId) copy(player1 = newState)
    else if (player2.playerId == playerId) copy(player2 = newState)
    else this
  }
  
  def bothPlayersReady: Boolean = 
    player1.currentAction.isDefined && player2.currentAction.isDefined
  
  def isGameOver: Boolean = gameStatus != GameStatus.InProgress
}

// ==================== 游戏结束结果 ====================

case class GameOverResult(
  winner: Option[String],
  finalPlayer1Health: Int,
  finalPlayer2Health: Int,
  totalRounds: Int,
  gameEndReason: String
)

object GameState {
  implicit val roundResultEncoder: Encoder[RoundResult] = deriveEncoder
  implicit val roundResultDecoder: Decoder[RoundResult] = deriveDecoder
  
  implicit val gameStateEncoder: Encoder[GameState] = deriveEncoder
  implicit val gameStateDecoder: Decoder[GameState] = deriveDecoder
  
  implicit val gameOverResultEncoder: Encoder[GameOverResult] = deriveEncoder
  implicit val gameOverResultDecoder: Decoder[GameOverResult] = deriveDecoder
}