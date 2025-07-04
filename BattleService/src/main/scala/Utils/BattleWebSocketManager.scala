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
import APIs.UserService.FetchUserStatusMessage
import org.joda.time.DateTime
import cats.effect.unsafe.implicits.global
import scala.concurrent.duration.*
import Common.DBAPI.{readDBJsonOptional, decodeField, decodeType}
import Common.Object.SqlParameter

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

  def updateGameState(newState: GameState): Unit = {
    logger.info(s"Updating game state for room $roomId: $newState")
    gameState = Some(newState)
  }

  /**
   * Get username from UserService by playerId
   */
  private def getUsernameByPlayerId(playerId: String): IO[String] = {
    implicit val planContext: PlanContext = PlanContext(TraceID(java.util.UUID.randomUUID().toString), 0)
    
    for {
      _ <- IO(logger.info(s"[getUsernameByPlayerId] 开始获取用户名: playerId=$playerId"))
      
      // 使用 FetchUserStatusMessage API 获取用户信息
      userOpt <- FetchUserStatusMessage(playerId).send
      
      username <- userOpt match {
        case Some(user) =>
          IO(logger.info(s"[getUsernameByPlayerId] 成功获取用户名: ${user.userName} for playerId=$playerId")) >>
          IO.pure(user.userName)
        case None =>
          IO(logger.warn(s"[getUsernameByPlayerId] 用户不存在: playerId=$playerId，使用默认名称")) >>
          IO.pure(s"Player $playerId")
      }
    } yield username
  }.handleErrorWith { error =>
    IO {
      logger.warn(s"[getUsernameByPlayerId] 获取用户名失败: playerId=$playerId, error=${error.getMessage}")
      s"Player $playerId" // 返回默认名称
    }
  }

  /**
   * Add a new WebSocket connection for a player
   */
  def addConnection(playerId: String, queue: Queue[IO, WebSocketFrame]): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"Adding connection for player $playerId in room $roomId"))
      _ <- IO(connections.put(playerId, queue))

      // Initialize player state if needed
      _ <- if (!gameState.exists(_.player1.playerId == playerId) && 
               !gameState.exists(_.player2.playerId == playerId)) {
        IO(logger.info(s"Initializing player $playerId in game state for room $roomId")) >>
        initializePlayerInGameStateIO(playerId) >>
        IO(logger.info(s"Finished Player $playerId initialized in game state for room $roomId"))
      } else {
        IO.unit
      }

      // Send current game state if available after a small delay to ensure connection is ready
      _ <- IO.sleep(100.milliseconds)
      _ <- IO {
        gameState.foreach { state =>
          sendToPlayer(playerId, WebSocketMessage("game_state", state.asJson))
          logger.info(s"Sent current game state to player $playerId in room $roomId")
        }
      }

      // Get username from UserService and notify other players that this player joined
      username <- getUsernameByPlayerId(playerId)
      playerJoinedMessage = WebSocketMessage(
        "player_joined", 
        Json.obj(
          "playerId" -> Json.fromString(playerId),
          "username" -> Json.fromString(username)
        )
      )
      _ <- IO(logger.info(s"In addConnection, start broadcastExcept"))
      _ <- IO(broadcastExcept(playerJoinedMessage, playerId))
      _ <- IO(logger.info("In addConnection, broadcastExcept finished"))
    } yield ()
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
    // the remaining time is paused when a player takes action
    gameState.foreach { state =>
      if (state.player1.playerId == playerId) {
        gameState = Some(state.copy(player1 = state.player1.copy(hasActed = true, currentAction = Some(action))))
      } else if (state.player2.playerId == playerId) {
        gameState = Some(state.copy(player2 = state.player2.copy(hasActed = true, currentAction = Some(action))))
      }
    }
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
      logger.info(s"Updated and start broadcast game state after setting player $playerId as ready in room $roomId, gameState: $updatedState")
      broadcast(WebSocketMessage("game_state", updatedState.asJson))
      logger.info(s"Finished broadcasting game state after setting player $playerId as ready in room $roomId")
    }

    // Check if both players are ready to start the game
    logger.info(s"Checking if both players are ready in room $roomId")
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
      // Save current state before processing
      stateBeforeBattle <- IO(gameState)
      
      // Process actions using PlayerActionProcess
      result <- PlayerActionProcess.processSimultaneousActions(
        roomId,
        player1Id, action1.`type`, None,
        player2Id, action2.`type`, None
      )

      // Update game state
      _ <- updateGameStateAfterAction(result)

      // Create round result message based on actual state changes
      roundResult <- createRoundResultFromStateChanges(action1, action2, stateBeforeBattle)

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
    implicit val planContext: PlanContext = PlanContext(TraceID(java.util.UUID.randomUUID().toString), 0)
    
    // Get updated player status from database after battle processing
    for {
      battleStateOpt <- readDBJsonOptional(
        s"""
        SELECT current_round, player_one_status, player_two_status
        FROM ${Common.ServiceUtils.schemaName}.battle_state_table
        WHERE room_id = ?
        """,
        List(Common.Object.SqlParameter("String", roomId))
      )
      
      _ <- battleStateOpt match {
        case Some(battleStateJson) =>
          IO {
            // Parse updated player statuses from database
            val player1StatusJson = decodeField[String](battleStateJson, "player_one_status")
            val player2StatusJson = decodeField[String](battleStateJson, "player_two_status")
            val currentRound = decodeField[Int](battleStateJson, "current_round")
            
            val player1Status = decodeType[Objects.BattleService.PlayerStatus](player1StatusJson)
            val player2Status = decodeType[Objects.BattleService.PlayerStatus](player2StatusJson)
            
            // Update game state with new player data
            gameState.foreach { state =>
              val updatedState = state.copy(
                currentRound = currentRound,
                roundPhase = "action", // 直接进入下一轮行动选择
                player1 = state.player1.copy(
                  health = player1Status.health,
                  energy = player1Status.energy,
                  currentAction = None, // 清除当前行动
                  remainingTime = 60, // 重置剩余时间
                  hasActed = false // 重置行动状态
                ),
                player2 = state.player2.copy(
                  health = player2Status.health,
                  energy = player2Status.energy,
                  currentAction = None, // 清除当前行动
                  remainingTime = 60, // 重置剩余时间
                  hasActed = false // 重置行动状态
                )
              )
              gameState = Some(updatedState)
              
              // Clear previous actions for next round
              currentActions.clear()
              
              // Broadcast updated game state
              broadcast(WebSocketMessage("game_state", updatedState.asJson))
              logger.info(s"Updated game state: Player1 H=${player1Status.health} E=${player1Status.energy}, Player2 H=${player2Status.health} E=${player2Status.energy}")
            }
          }
        case None =>
          IO {
            // Fallback: just increment round if no database state found
            logger.warn(s"No battle state found in database for room $roomId, using fallback update")
            gameState.foreach { state =>
              val updatedState = state.copy(
                currentRound = state.currentRound + 1,
                roundPhase = "action",
                player1 = state.player1.copy(
                  health = 666,
                  energy = 0,
                  remainingTime = 60, // 重置剩余时间
                ),
                player2 = state.player2.copy(
                  health = 666,
                  energy = 0,
                  remainingTime = 60 // 重置剩余时间
                )
              )
              gameState = Some(updatedState)
              currentActions.clear()
              broadcast(WebSocketMessage("game_state", updatedState.asJson))
            }
          }
      }
    } yield ()
  }

  /**
   * Check if the game is over
   */
  private def checkGameOver: IO[Unit] = {
    IO {
      // Check if any player's health is 0
      gameState.foreach { state =>
        if (state.player1.health <= 0 || state.player2.health <= 0) {
          val winnerName = if (state.player1.health <= 0 ) {
            state.player2.username
          } else {
            state.player1.username
          }
          val reason = "health_zero"

          val gameOverResult = GameOverResult(
            winner = winnerName,
            reason = reason,
            rewards = Some(Json.obj(
              "stones" -> Json.fromInt(10),
              "rankChange" -> Json.fromInt(5)
            ))
          )
          // also update game state to finished
          val updatedState = state.copy(
            roundPhase = "finished",
            winner = Some(winnerName)
          )
          gameState = Some(updatedState)
          // Broadcast game over message
          logger.info(s"Game over in room $roomId: Winner: ${gameOverResult.winner}, Reason: ${gameOverResult.reason}")

          broadcast(WebSocketMessage("game_state", updatedState.asJson))
          broadcast(WebSocketMessage("game_over", gameOverResult.asJson))
        }
      }
    }
  }

  /**
   * Create a round result message based on actual state changes
   */
  private def createRoundResultFromStateChanges(
    action1: BattleAction, 
    action2: BattleAction, 
    stateBeforeBattle: Option[GameState]
  ): IO[RoundResult] = {
    IO {
      val currentState = gameState
      
      (stateBeforeBattle, currentState) match {
        case (Some(beforeState), Some(afterState)) =>
          // Calculate actual changes
          val player1HealthChange = afterState.player1.health - beforeState.player1.health
          val player1EnergyChange = afterState.player1.energy - beforeState.player1.energy
          val player2HealthChange = afterState.player2.health - beforeState.player2.health
          val player2EnergyChange = afterState.player2.energy - beforeState.player2.energy
          
          RoundResult(
            round = beforeState.currentRound,
            player1Action = action1,
            player2Action = action2,
            results = Json.obj(
              "player1" -> Json.obj(
                "healthChange" -> Json.fromInt(player1HealthChange), 
                "energyChange" -> Json.fromInt(player1EnergyChange)
              ),
              "player2" -> Json.obj(
                "healthChange" -> Json.fromInt(player2HealthChange), 
                "energyChange" -> Json.fromInt(player2EnergyChange)
              )
            ),
            cardEffects = List()
          )
          
        case _ =>
          logger.warn(s"！！！！In CreateRoundResultFromStateChanges: Game state not available for round result creation in room $roomId")
          // Fallback RoundResult
          RoundResult(
            round         = stateBeforeBattle.map(_.currentRound).getOrElse(0),
            player1Action = action1,
            player2Action = action2,
            results       = Json.obj(
              "player1" -> Json.obj("healthChange" -> Json.fromInt(0), "energyChange" -> Json.fromInt(0)),
              "player2" -> Json.obj("healthChange" -> Json.fromInt(0), "energyChange" -> Json.fromInt(0))
            ),
            cardEffects   = List()
          )
      }
    }
  }

  /**
   * Initialize a player in the game state (IO version)
   */
  private def initializePlayerInGameStateIO(playerId: String): IO[Unit] = {
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
            logger.info(s"Player1 exists, Start Player $playerId initialized as player 2 in room $roomId")
            // 重要：这里需要广播给所有玩家包括已连接的 Player1
            broadcast(WebSocketMessage("game_state", updatedState.asJson))
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
              isConnected = false,  //other default values we don't want to set again
            ),
            currentRound = 1,
            roundPhase = "waiting",
            winner = None
          )
          gameState = Some(newState)
          logger.info(s"Player $playerId initialized as player 1 in room $roomId")
          broadcast(WebSocketMessage("game_state", newState.asJson))
      }
    }.handleErrorWith { error =>
      IO {
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
              broadcast(WebSocketMessage("game_state", updatedState.asJson))
            }

          case None =>
            logger.warn(s"No game state for player $playerId in room $roomId")
        }
      }
    }
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
          player1 = state.player1.copy(remainingTime = 3000, hasActed = false),
          player2 = state.player2.copy(remainingTime = 3000, hasActed = false)
        )
        gameState = Some(updatedState)
        broadcastGameState(updatedState)
      }
      else {
        logger.info(s"Not all players are ready in room $roomId: Player ${state.player1.username} ready=${state.player1.isReady}, Player ${state.player2.username} ready=${state.player2.isReady}")
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
  def broadcast(message: WebSocketMessage): Unit = {
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
    logger.info(s"Start Broadcasting to all players except $exceptPlayerId in room $roomId: $jsonMessage")

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
