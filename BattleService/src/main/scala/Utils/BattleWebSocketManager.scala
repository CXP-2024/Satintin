package Utils

import cats.effect.*
import cats.effect.std.Queue
import cats.implicits.*
import io.circe.*
import io.circe.generic.auto.*
import io.circe.syntax.*
import org.http4s.websocket.WebSocketFrame
import org.slf4j.LoggerFactory
import scala.collection.concurrent.TrieMap
import Common.API.PlanContext
import Common.API.TraceID
import Objects.BattleService.{BattleAction, GameState, PlayerState, RoundResult, GameOverResult, CardEffect}
import APIs.UserService.GetUserInfoMessage
import org.joda.time.DateTime
import cats.effect.unsafe.implicits.global
import scala.concurrent.duration.*

/**
 * Manages WebSocket connections and game state for a battle room
 */
class BattleWebSocketManager(roomId: String) {
  private val logger = LoggerFactory.getLogger(getClass)

  // Player connections
  private val connections = TrieMap[String, Queue[IO, WebSocketFrame]]()

  // Player actions for the current round
  private val currentActions = TrieMap[String, BattleAction]()

  // Player ready status
  private val playerReady = TrieMap[String, Boolean]()

  // Current game state
  private var gameState: Option[GameState] = None

  /**
   * Get username from UserService by playerId
   */
  private def getUsernameByPlayerId(playerId: String): IO[String] = {
    implicit val planContext: PlanContext = PlanContext(TraceID(java.util.UUID.randomUUID().toString), 0)
    
    GetUserInfoMessage(playerId, playerId).send.map { user =>
      user.userName
    }.handleErrorWith { error =>
      logger.warn(s"Failed to get username for player $playerId: ${error.getMessage}")
      IO.pure(s"Player $playerId") // Fallback to default name
    }
  }

  /**
   * Add a new WebSocket connection for a player
   */
  def addConnection(playerId: String, queue: Queue[IO, WebSocketFrame]): IO[Unit] = IO {
    logger.info(s"Adding connection for player $playerId in room $roomId")
    connections.put(playerId, queue)

    // Initialize player state if needed
    if (!gameState.exists(_.player1.playerId == playerId) && 
        !gameState.exists(_.player2.playerId == playerId)) {
      initializePlayerInGameState(playerId)
    }
  }.flatMap { _ =>
    // Send current game state if available after a small delay to ensure connection is ready
    IO.sleep(100.milliseconds) >> IO {
      gameState.foreach { state =>
        sendToPlayer(playerId, WebSocketMessage("game_state", state.asJson))
      }
    } >> {
      // Get username from UserService and notify other players that this player joined
      getUsernameByPlayerId(playerId).flatMap { username =>
        val playerJoinedMessage = WebSocketMessage(
          "player_joined", 
          Json.obj(
            "playerId" -> Json.fromString(playerId),
            "username" -> Json.fromString(username)
          )
        )
        IO(broadcastExcept(playerJoinedMessage, playerId))
        IO(logger.info("end of addConnection"))
      }
    }
  }

  /**
   * Remove a WebSocket connection for a player
   */
  def removeConnection(playerId: String): IO[Unit] = IO {
    logger.info(s"Removing connection for player $playerId in room $roomId")
    connections.remove(playerId)
    currentActions.remove(playerId)
    playerReady.remove(playerId)

    // Notify other players that this player left
    val playerLeftMessage = WebSocketMessage(
      "player_left", 
      Json.obj("playerId" -> Json.fromString(playerId))
    )
    broadcast(playerLeftMessage)

    // Update game state to mark player as disconnected
    gameState.foreach { state =>
      val updatedState = if (state.player1.playerId == playerId) {
        state.copy(player1 = state.player1.copy(isConnected = false))
      } else if (state.player2.playerId == playerId) {
        state.copy(player2 = state.player2.copy(isConnected = false))
      } else {
        state
      }
      gameState = Some(updatedState)
      broadcastGameState(updatedState)
    }
  }

  /**
   * Record a player action for the current round
   */
  def recordPlayerAction(playerId: String, action: BattleAction): IO[Unit] = IO {
    logger.info(s"Recording action for player $playerId in room $roomId: $action")
    currentActions.put(playerId, action)
  }

  /**
   * Set a player as ready
   */
  def setPlayerReady(playerId: String): IO[Unit] = IO {
    logger.info(s"Setting player $playerId as ready in room $roomId")
    playerReady.put(playerId, true)

    // Update game state
    gameState.foreach { state =>
      val updatedState = if (state.player1.playerId == playerId) {
        state.copy(player1 = state.player1.copy(isReady = true))
      } else if (state.player2.playerId == playerId) {
        state.copy(player2 = state.player2.copy(isReady = true))
      } else {
        state
      }
      gameState = Some(updatedState)
      broadcastGameState(updatedState)
    }

    // Check if both players are ready to start the game
    checkAndStartGame
  }

  /**
   * Check if both players have submitted actions and process them
   */
  def checkAndProcessActions: IO[Unit] = {
    if (currentActions.size >= 2) {
      logger.info(s"Both players have submitted actions in room $roomId, processing...")

      // Get player IDs from game state
      gameState match {
        case Some(state) =>
          val player1Id = state.player1.playerId
          val player2Id = state.player2.playerId

          // Get actions
          (currentActions.get(player1Id), currentActions.get(player2Id)) match {
            case (Some(action1), Some(action2)) =>
              // Clear current actions
              currentActions.clear()

              // Process actions using PlayerActionProcess
              processActions(player1Id, action1, player2Id, action2)

            case _ =>
              // Not all players have submitted actions yet
              IO.unit
          }

        case None =>
          logger.warn(s"Game state not initialized for room $roomId")
          IO.unit
      }
    } else {
      // Not all players have submitted actions yet
      IO.unit
    }
  }

  /**
   * Process actions from both players
   */
  private def processActions(
    player1Id: String, action1: BattleAction,
    player2Id: String, action2: BattleAction
  ): IO[Unit] = {
    implicit val planContext: PlanContext = PlanContext(TraceID(java.util.UUID.randomUUID().toString), 0)

    for {
      // Process actions using PlayerActionProcess
      result <- PlayerActionProcess.processSimultaneousActions(
        roomId,
        player1Id, action1.`type`, None,
        player2Id, action2.`type`, None
      )

      // Update game state
      _ <- updateGameStateAfterAction(result)

      // Create round result message
      roundResult = createRoundResult(action1, action2, result)

      // Broadcast round result
      _ <- IO(broadcast(WebSocketMessage("round_result", roundResult.asJson)))

      // Check if game is over
      _ <- checkGameOver
    } yield ()
  }

  /**
   * Update game state after processing actions
   */
  private def updateGameStateAfterAction(result: String): IO[Unit] = {
    // Parse result and update game state
    // In a real implementation, this would parse the result string and update the game state
    // For now, we'll just increment the round number
    gameState.foreach { state =>
      val updatedState = state.copy(
        currentRound = state.currentRound + 1,
        roundPhase = "waiting"
      )
      gameState = Some(updatedState)
      broadcastGameState(updatedState)
    }

    IO.unit
  }

  /**
   * Check if the game is over
   */
  private def checkGameOver: IO[Unit] = {
    // Check if any player's health is 0
    gameState.foreach { state =>
      if (state.player1.health <= 0 || state.player2.health <= 0) {
        val winnerId = if (state.player1.health <= 0) state.player2.playerId else state.player1.playerId
        val reason = "health_zero"

        val gameOverResult = GameOverResult(
          winner = winnerId,
          reason = reason,
          rewards = Some(Json.obj(
            "stones" -> Json.fromInt(10),
            "rankChange" -> Json.fromInt(5)
          ))
        )

        broadcast(WebSocketMessage("game_over", gameOverResult.asJson))
      }
    }

    IO.unit
  }

  /**
   * Create a round result message
   */
  private def createRoundResult(action1: BattleAction, action2: BattleAction, result: String): RoundResult = {
    // In a real implementation, this would parse the result string
    // For now, we'll create a dummy round result
    gameState.map { state =>
      RoundResult(
        round = state.currentRound,
        player1Action = action1,
        player2Action = action2,
        results = Json.obj(
          "player1" -> Json.obj("healthChange" -> Json.fromInt(-1), "energyChange" -> Json.fromInt(1)),
          "player2" -> Json.obj("healthChange" -> Json.fromInt(-1), "energyChange" -> Json.fromInt(1))
        ),
        cardEffects = List()
      )
    }.getOrElse(
      RoundResult(
        round = 1,
        player1Action = action1,
        player2Action = action2,
        results = Json.obj(
          "player1" -> Json.obj("healthChange" -> Json.fromInt(0), "energyChange" -> Json.fromInt(0)),
          "player2" -> Json.obj("healthChange" -> Json.fromInt(0), "energyChange" -> Json.fromInt(0))
        ),
        cardEffects = List()
      )
    )
  }

  /**
   * Initialize a player in the game state
   */
  private def initializePlayerInGameState(playerId: String): Unit = {
    // Get username from UserService and create player state
    getUsernameByPlayerId(playerId).map { username =>
      val newPlayerState = PlayerState(
        playerId = playerId,
        username = username,
        health = 6,
        energy = 0,
        rank = "Bronze",
        cards = List(),
        isReady = false,
        isConnected = true
      )

      gameState match {
        case Some(state) =>
          // Add as player 2 if player 1 exists
          if (state.player1.playerId.nonEmpty && state.player1.playerId != playerId && state.player2.playerId.isEmpty) {
            val updatedState = state.copy(player2 = newPlayerState)
            gameState = Some(updatedState)
            broadcastGameState(updatedState)
          }

        case None =>
          // Create new game state with this player as player 1
          val newState = GameState(
            roomId = roomId,
            player1 = newPlayerState,
            player2 = PlayerState(
              playerId = "",
              username = "Waiting for opponent...",
              health = 6,
              energy = 0,
              rank = "",
              cards = List(),
              isReady = false,
              isConnected = false
            ),
            currentRound = 1,
            roundPhase = "waiting",
            remainingTime = 30,
            winner = None
          )
          gameState = Some(newState)
          broadcastGameState(newState)
      }
    }.handleErrorWith { error =>
      logger.warn(s"Failed to initialize player $playerId: ${error.getMessage}")
      // Fallback to using playerId as username
      val newPlayerState = PlayerState(
        playerId = playerId,
        username = s"Error initializing player $playerId in room $roomId from backend",
        health = 6,
        energy = 0,
        rank = "Bronze",
        cards = List(),
        isReady = false,
        isConnected = true
      )

      gameState match {
        case Some(state) =>
          if (state.player1.playerId.nonEmpty && state.player1.playerId != playerId && state.player2.playerId.isEmpty) {
            val updatedState = state.copy(player2 = newPlayerState)
            gameState = Some(updatedState)
            broadcastGameState(updatedState)
          }

        case None =>
          val newState = GameState(
            roomId = roomId,
            player1 = newPlayerState,
            player2 = PlayerState(
              playerId = "",
              username = "Waiting for opponent",
              health = 6,
              energy = 0,
              rank = "",
              cards = List(),
              isReady = false,
              isConnected = false
            ),
            currentRound = 1,
            roundPhase = "waiting",
            remainingTime = 30,
            winner = None
          )
          gameState = Some(newState)
          broadcastGameState(newState)
      }
      IO.unit
    }.unsafeRunSync()
  }

  /**
   * Check if both players are ready and start the game
   */
  private def checkAndStartGame: Unit = {
    gameState.foreach { state =>
      if (state.player1.isReady && state.player2.isReady) {
        logger.info(s"Both players are ready in room $roomId, starting game")

        val updatedState = state.copy(
          roundPhase = "action",
          remainingTime = 30
        )
        gameState = Some(updatedState)
        broadcastGameState(updatedState)
      }
    }
  }

  /**
   * Broadcast game state to all connected players
   */
  def broadcastGameState(state: GameState): IO[Unit] = IO {
    logger.info(s"Broadcasting game state for room $roomId: $state")
    gameState = Some(state)
    broadcast(WebSocketMessage("game_state", state.asJson))
  }

  /**
   * Broadcast a message to all connected players
   */
  private def broadcast(message: WebSocketMessage): Unit = {
    val jsonMessage = message.asJson.noSpaces
    logger.info(s"Broadcasting to all players in room $roomId: $jsonMessage")

    connections.foreach { case (playerId, queue) =>
      // Use attempt() to handle potential failures gracefully
      queue.offer(WebSocketFrame.Text(jsonMessage)).attempt.unsafeRunSync() match {
        case Right(_) => 
          logger.debug(s"Message sent successfully to player $playerId")
        case Left(error) => 
          logger.warn(s"Failed to send message to player $playerId: ${error.getMessage}")
          // Optionally remove the failed connection
          connections.remove(playerId)
      }
    }
  }

  /**
   * Broadcast a message to all connected players except one
   */
  private def broadcastExcept(message: WebSocketMessage, exceptPlayerId: String): Unit = {
    val jsonMessage = message.asJson.noSpaces
    logger.info(s"Broadcasting to all players except $exceptPlayerId in room $roomId: $jsonMessage")

    connections.foreach { case (playerId, queue) =>
      if (playerId != exceptPlayerId) {
        queue.offer(WebSocketFrame.Text(jsonMessage)).attempt.unsafeRunSync() match {
          case Right(_) => 
            logger.debug(s"Message sent successfully to player $playerId")
          case Left(error) => 
            logger.warn(s"Failed to send message to player $playerId: ${error.getMessage}")
            // Optionally remove the failed connection
            connections.remove(playerId)
        }
      }
    }
  }

  /**
   * Send a message to a specific player
   */
  private def sendToPlayer(playerId: String, message: WebSocketMessage): Unit = {
    val jsonMessage = message.asJson.noSpaces
    logger.info(s"Sending to player $playerId in room $roomId: $jsonMessage")

    connections.get(playerId).foreach { queue =>
      queue.offer(WebSocketFrame.Text(jsonMessage)).attempt.unsafeRunSync() match {
        case Right(_) => 
          logger.debug(s"Message sent successfully to player $playerId")
        case Left(error) => 
          logger.warn(s"Failed to send message to player $playerId: ${error.getMessage}")
          // Remove the failed connection
          connections.remove(playerId)
      }
    }
  }

  /**
   * Get the current game state
   */
  def getGameState: Option[GameState] = gameState

  /**
   * Get a player's current action
   */
  def getPlayerAction(playerId: String): Option[BattleAction] = currentActions.get(playerId)

  /**
   * WebSocket message structure
   */
  case class WebSocketMessage(`type`: String, data: Json)
}
