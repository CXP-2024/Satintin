package Utils

import APIs.CardService.{CardTemplate, GetCardTemplateByIDMessage, LoadBattleDeckMessage}
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
import Objects.BattleService.{BattleAction, CardState, GameOverResult, GameState, PlayerState, RoundResult}
import cats.effect.unsafe.implicits.global

import scala.concurrent.duration.*
import Utils.gamecore.BattleResolver


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

  // get 3 cards ID from LoadBattleDeckMessage API
  private def getInitialCardList(playerId: String, userName: String): IO[List[String]] = {
    implicit val planContext: PlanContext = PlanContext(TraceID(java.util.UUID.randomUUID().toString), 0)
    logger.info(s"Start Fetching Initial Card List for player $userName")
    LoadBattleDeckMessage(playerId).send.map { battleDeck =>
      battleDeck
    }.handleErrorWith { error =>
      logger.warn(s"Failed to get Initial Card List for player $playerId: ${error.getMessage}")
      IO.pure(List(s"!!!!!!!!!!!!!!!!!!!!!!! Error in getInitialCards of Player $playerId ")) // Fallback to default name
    }
  }

  /**
   * Add a new WebSocket connection for a player
   */
  def addConnection(playerId: String, userName: String, queue: Queue[IO, WebSocketFrame]): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"Adding connection for player $userName in room $roomId"))
      _ <- IO(connections.put(playerId, queue))

      // Initialize player state if needed
      _ <- if (!gameState.exists(_.player1.playerId == playerId) && 
               !gameState.exists(_.player2.playerId == playerId)) {
        IO(logger.info(s"Initializing player $userName in game state for room $roomId")) >>
        initializePlayerInGameStateIO(playerId, userName) >>
        IO(logger.info(s"Finished Player $userName initialized in game state for room $roomId"))
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

      playerJoinedMessage = WebSocketMessage(
        "player_joined", 
        Json.obj(
          "playerId" -> Json.fromString(playerId),
          "username" -> Json.fromString(userName)
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
   * Parse and record a player action from frontend JSON
   */
  def parseAndRecordPlayerAction(playerId: String, jsonStr: String)(using PlanContext): IO[Unit] = {
    for {
      // 使用BattleActionManager解析前端动作
      actionResult <- BattleActionManager.parseActionJson(jsonStr)
      _ <- actionResult match {
        case Right(action) => 
          logger.info(s"Successfully parsed action for player $playerId in room $roomId")
          recordPlayerAction(playerId, action)
        case Left(error) => 
          logger.error(s"Failed to parse action for player $playerId in room $roomId: ${error.getMessage}")
          IO.raiseError(error)
      }
    } yield ()
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
      stateBeforeBattleOpt <- IO(gameState)
      
      // Make sure we have a game state before proceeding
      _ <- if (stateBeforeBattleOpt.isEmpty) {
        IO(logger.error(s"No game state available in room $roomId before processing actions"))
      } else IO.unit
      
      // Process actions using BattleResolver, unwrap Option
      result <- stateBeforeBattleOpt match {
        case Some(stateBeforeBattle) =>
          // Process actions using the new BattleResolver that returns (GameState, RoundResult)
          val (updatedGameState, roundResult) = BattleResolver(stateBeforeBattle, action1, action2)
          
          // Update the game state
          IO {
            gameState = Some(updatedGameState)
            // Broadcast updated game state
            broadcast(WebSocketMessage("game_state", updatedGameState.asJson))
            // Broadcast round result
            broadcast(WebSocketMessage("round_result", roundResult.asJson))
          }
          
        case None =>
          IO(logger.error("Cannot process actions: game state is not initialized"))
      }

      // Check if game is over
      _ <- checkGameOver
    } yield ()
  }


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

  // decide effect chance based on rarity
  private def ChooseEffect(rarity: String): Double = {
    rarity match {
      case "普通" => 0.05
      case "稀有" => 0.15
      case "传说" => 0.99
      case _ => 0.1 // Default chance for unknown rarities
    }
  }

  //Convert CardTemplate to BattleCard
  private def ConvertCardTemplateToBattleCard(card: CardTemplate): CardState = {
    // Assuming CardState has a constructor that takes the same parameters as CardTemplate
    CardState(
      cardId = card.cardID,
      name = card.cardName,
      `type` = card.description,
      rarity = card.rarity,
      effectChance = ChooseEffect(card.rarity)
    )
  }

  /**
   * Initialize a player in the game state (IO version)
   */
  private def initializePlayerInGameStateIO(playerId: String, userName: String): IO[Unit] = {
    implicit val planContext: PlanContext = PlanContext(TraceID(java.util.UUID.randomUUID().toString), 0)
    
    (for {
      initialCardList <- getInitialCardList(playerId, userName)
      _ <- IO(logger.info(s"初始化Cards: Player $userName initialized with cards: $initialCardList"))
      // Use card list to get initial cards by getCardTemplateByIDMessage API
      card1 <- GetCardTemplateByIDMessage(initialCardList.head).send
      card1_battle = ConvertCardTemplateToBattleCard(card1)
      _ <- IO(logger.info(s"获取到第一张卡牌模板: $card1_battle"))
      card2 <- GetCardTemplateByIDMessage(initialCardList(1)).send
      card2_battle = ConvertCardTemplateToBattleCard(card2)
      _ <- IO(logger.info(s"获取到第二张卡牌模板: $card2_battle"))
      card3 <- GetCardTemplateByIDMessage(initialCardList(2)).send
      card3_battle = ConvertCardTemplateToBattleCard(card3)
      _ <- IO(logger.info(s"获取到第三张卡牌模板: $card3_battle"))

      _ <- IO {
        val newPlayerState = PlayerState(
          playerId = playerId,
          username = userName,
          health = 6,
          energy = 0,
          rank = "黑铁",
          cards = List(card1_battle, card2_battle, card3_battle), // 使用获取到的卡牌ID列表
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
      }
    } yield ()).handleErrorWith { error =>
      IO {
        logger.warn(s"Failed to initialize player $playerId: ${error.getMessage}")
        // Fallback to using playerId as username
        val newPlayerState = PlayerState(
          playerId = playerId,
          username = s"Error initializing player $playerId in room $roomId from backend",
          health = 6,
          energy = 0,
          rank = "黑铁",
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
