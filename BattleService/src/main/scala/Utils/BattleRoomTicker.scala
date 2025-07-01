package Utils

import cats.effect.*
import fs2.Stream
import org.slf4j.LoggerFactory
import scala.concurrent.duration.*
import Process.Routes
import Objects.BattleService.{GameState, BattleAction}
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
    Stream.awakeEvery[IO](15.second)
      .evalMap(_ => tickTask())
      .compile
      .drain
  }
  
  /**
   * Periodic task to update all active battle rooms
   */
  private def tickTask(): IO[Unit] = {
    logger.debug("Running battle room ticker task")
    
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
        if (state.roundPhase == "action" && state.remainingTime > 0) {
          // Decrement remaining time
          val updatedState = state.copy(remainingTime = state.remainingTime - 1)
          
          // Check if time is up
          if (updatedState.remainingTime <= 0) {
            handleTimeUp(roomId, manager, updatedState)
          } else {
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
  private def handleTimeUp(roomId: String, manager: BattleWebSocketManager, state: GameState): IO[Unit] = {
    logger.info(s"Time up for room $roomId, round ${state.currentRound}")
    
    // Get current actions
    val player1Actions = manager.getPlayerAction(state.player1.playerId)
    val player2Actions = manager.getPlayerAction(state.player2.playerId)
    
    // If any player hasn't submitted an action, use a default action
    val defaultAction = BattleAction("defense", "", System.currentTimeMillis())
    
    val player1Action = player1Actions.getOrElse(defaultAction.copy(playerId = state.player1.playerId))
    val player2Action = player2Actions.getOrElse(defaultAction.copy(playerId = state.player2.playerId))
    
    // Process actions
    for {
      _ <- manager.recordPlayerAction(state.player1.playerId, player1Action)
      _ <- manager.recordPlayerAction(state.player2.playerId, player2Action)
      _ <- manager.checkAndProcessActions
    } yield ()
  }
}