package Utils

import cats.effect.*
import fs2.Stream
import io.circe.syntax._ // for .asJson
import org.slf4j.LoggerFactory

import scala.concurrent.duration.*
import Process.Routes
import Objects.BattleService.{BattleAction, GameOverResult, GameState, PlayerState}
import io.circe.Json
import cats.Foldable.ops.toAllFoldableOps

/**
 * Handles periodic updates for battle rooms
 */
object BattleRoomTicker {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * Start the ticker for periodic updates
   */
  def start: IO[Unit] = {
    logger.info("Starting BattleRoomTicker")
    
    // Run ticker every second
    Stream.awakeEvery[IO](1.second)
      .evalMap(_ => tickTask())
      .compile
      .drain
  }
  
  /**
   * Periodic task to update all active battle rooms
   */
  private def tickTask(): IO[Unit] = {
    //logger.debug("Running battle room ticker task")
    
    // Update all active rooms
    Routes.battleRooms.toList.traverse_ { case (roomId, manager) =>
      updateRoom(roomId, manager)
    }
  }
  
  /**
   * Update a single battle room
   */
  private def updateRoom(roomId: String, manager: BattleWebSocketManager): IO[Unit] = {
    // Get current game state
    IO.fromOption(manager.getGameState)(new RuntimeException(s"No game state for room $roomId"))
      .flatMap { state =>
        // Only update if game is in progress
        if (state.roundPhase == "action") {
          // only tick down players who haven’t acted yet
          val p1 = if (state.player1.hasActed) state.player1
          else state.player1.copy(remainingTime = state.player1.remainingTime - 1)

          val p2 = if (state.player2.hasActed) state.player2
          else state.player2.copy(remainingTime = state.player2.remainingTime - 1)

          val updatedState = state.copy(player1 = p1, player2 = p2)
          
          // Check if time is up
          if (updatedState.player1.remainingTime <= 0) {
            handleTimeUp(roomId, updatedState.player1.playerId, manager, updatedState)
          }
          else if (updatedState.player2.remainingTime <= 0) {
            handleTimeUp(roomId, updatedState.player2.playerId, manager, updatedState)
          }
          else {
            // Just update the time
            manager.broadcastGameState(updatedState)
          }
        } else {
          IO.unit
        }
      }
      .handleErrorWith { error =>
        IO(logger.error(s"Error updating room $roomId: ${error.getMessage}"))
      }
  }
  
  /**
   * Handle time up for a round
   */
  private def handleTimeUp(roomId: String, playerId: String, manager: BattleWebSocketManager, state: GameState): IO[Unit] = {
    // Check if game is already finished to avoid duplicate messages
    if (state.roundPhase == "finished") {
      logger.warn(s"Room $roomId: Player $playerId timed out but game is already finished.")
      IO.unit
    } else {
      IO { 
        val winnerName = if (state.player1.playerId == playerId) {
          state.player2.username
        } else {
          state.player1.username
        }
        val reason = s"${if (state.player1.playerId == playerId) state.player1.username else state.player2.username}未采取行动"

        val gameOverState = state.copy(
          roundPhase = "finished"
        )
        val gameOverResult = GameOverResult(
          winner = winnerName,
          reason = reason,
          rewards = Some(Json.obj(
            "stones" -> Json.fromInt(10),
            "rankChange" -> Json.fromInt(5)
          )),
        )

        // First update the manager's internal state
        manager.updateGameState(gameOverState)
        
        // Then broadcast the game over message
        logger.info(s"Room $roomId: Player $playerId timed out. Winner: ${gameOverResult.winner}, Reason: ${gameOverResult.reason}")
        manager.broadcast(manager.WebSocketMessage("game_over", gameOverResult.asJson))
      }
    }
  }
}