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
import Common.API.{PlanContext, TraceID}
import Objects.BattleService.{BattleAction, CardState, GameOverResult, GameState, PlayerState, RoundResult}
import cats.effect.unsafe.implicits.global
import scala.concurrent.duration.*
import Utils.gamecore.BattleResolver

class BattleWebSocketManager(roomId: String) {
  private val logger = LoggerFactory.getLogger(getClass)
  private val connections = TrieMap[String, Queue[IO, WebSocketFrame]]()
  private val currentActions = TrieMap[String, BattleAction]()
  private val playerReady = TrieMap[String, Boolean]()
  private var gameState: Option[GameState] = None

  def updateGameState(newState: GameState): Unit = {
    gameState = Some(newState)
  }

  private def getInitialCardList(playerId: String, userName: String): IO[List[String]] = {
    implicit val planContext: PlanContext = PlanContext(TraceID(java.util.UUID.randomUUID().toString), 0)
    LoadBattleDeckMessage(playerId).send.map { battleDeck =>
      battleDeck
    }.handleErrorWith { error =>
      IO.pure(List(s"Error in getInitialCards of Player $playerId "))
    }
  }

  def addConnection(playerId: String, userName: String, queue: Queue[IO, WebSocketFrame]): IO[Unit] = {
    for {
      _ <- IO(connections.put(playerId, queue))
      _ <- if (!gameState.exists(_.player1.playerId == playerId) && 
               !gameState.exists(_.player2.playerId == playerId)) {
        initializePlayerInGameStateIO(playerId, userName)
      } else {
        IO.unit
      }
      _ <- IO.sleep(100.milliseconds)
      _ <- IO {
        gameState.foreach { state =>
          sendToPlayer(playerId, WebSocketMessage("game_state", state.asJson))
        }
      }
      playerJoinedMessage = WebSocketMessage(
        "player_joined", 
        Json.obj(
          "playerId" -> Json.fromString(playerId),
          "username" -> Json.fromString(userName)
        )
      )
      _ <- IO(broadcastExcept(playerJoinedMessage, playerId))
    } yield ()
  }

  def removeConnection(playerId: String): IO[Unit] = IO {
    connections.remove(playerId)
    currentActions.remove(playerId)
    playerReady.remove(playerId)
    val playerLeftMessage = WebSocketMessage("player_left", Json.obj("playerId" -> Json.fromString(playerId)))
    broadcast(playerLeftMessage)
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

  def recordPlayerAction(playerId: String, action: BattleAction): IO[Unit] = IO {
    currentActions.put(playerId, action)
    gameState.foreach { state =>
      if (state.player1.playerId == playerId) {
        gameState = Some(state.copy(player1 = state.player1.copy(hasActed = true, currentAction = Some(action))))
      } else if (state.player2.playerId == playerId) {
        gameState = Some(state.copy(player2 = state.player2.copy(hasActed = true, currentAction = Some(action))))
      }
    }
  }
  
  def parseAndRecordPlayerAction(playerId: String, jsonStr: String)(using PlanContext): IO[Unit] = {
    for {
      actionResult <- BattleActionManager.parseActionJson(jsonStr)
      _ <- actionResult match {
        case Right(action) => recordPlayerAction(playerId, action)
        case Left(error) => IO.raiseError(error)
      }
    } yield ()
  }

  def setPlayerReady(playerId: String): IO[Unit] = IO {
    playerReady.put(playerId, true)
    gameState.foreach { state =>
      val updatedState = if (state.player1.playerId == playerId) {
        state.copy(player1 = state.player1.copy(isReady = true))
      } else if (state.player2.playerId == playerId) {
        state.copy(player2 = state.player2.copy(isReady = true))
      } else {
        state
      }
      gameState = Some(updatedState)
      broadcast(WebSocketMessage("game_state", updatedState.asJson))
    }
    checkAndStartGame
  }

  def checkAndProcessActions: IO[Unit] = {
    if (currentActions.size >= 2) {
      gameState match {
        case Some(state) =>
          val player1Id = state.player1.playerId
          val player2Id = state.player2.playerId
          (currentActions.get(player1Id), currentActions.get(player2Id)) match {
            case (Some(action1), Some(action2)) =>
              currentActions.clear()
              processActions(player1Id, action1, player2Id, action2)
            case _ => IO.unit
          }
        case None => IO.unit
      }
    } else {
      IO.unit
    }
  }

  private def processActions(player1Id: String, action1: BattleAction, player2Id: String, action2: BattleAction): IO[Unit] = {
    implicit val planContext: PlanContext = PlanContext(TraceID(java.util.UUID.randomUUID().toString), 0)
    for {
      stateBeforeBattleOpt <- IO(gameState)
      _ <- if (stateBeforeBattleOpt.isEmpty) { IO.unit } else IO.unit
      result <- stateBeforeBattleOpt match {
        case Some(stateBeforeBattle) =>
          val (updatedGameState, roundResult) = BattleResolver(stateBeforeBattle, action1, action2)
          IO {
            gameState = Some(updatedGameState)
            broadcast(WebSocketMessage("game_state", updatedGameState.asJson))
            broadcast(WebSocketMessage("round_result", roundResult.asJson))
          }
        case None => IO.unit
      }
      _ <- checkGameOver
    } yield ()
  }

  private def checkGameOver: IO[Unit] = {
    IO {
      gameState.foreach { state =>
        if (state.player1.health <= 0 || state.player2.health <= 0) {
          val winnerName = if (state.player1.health <= 0 ) { state.player2.username } else { state.player1.username }
          val reason = "health_zero"
          val gameOverResult = GameOverResult(winner = winnerName, reason = reason, rewards = Some(Json.obj("stones" -> Json.fromInt(10), "rankChange" -> Json.fromInt(5))))
          val updatedState = state.copy(roundPhase = "finished", winner = Some(winnerName))
          gameState = Some(updatedState)
          broadcast(WebSocketMessage("game_state", updatedState.asJson))
          broadcast(WebSocketMessage("game_over", gameOverResult.asJson))
        }
      }
    }
  }

  private def ChooseEffect(rarity: String): Double = {
    rarity match {
      case "普通" => 0.05
      case "稀有" => 0.15
      case "传说" => 0.99
      case _ => 0.1
    }
  }

  private def ConvertCardTemplateToBattleCard(card: CardTemplate): CardState = {
    CardState(cardId = card.cardID, name = card.cardName, `type` = card.description, rarity = card.rarity, effectChance = ChooseEffect(card.rarity))
  }

  private def initializePlayerInGameStateIO(playerId: String, userName: String): IO[Unit] = {
    implicit val planContext: PlanContext = PlanContext(TraceID(java.util.UUID.randomUUID().toString), 0)
    (for {
      initialCardList <- getInitialCardList(playerId, userName)
      card1 <- GetCardTemplateByIDMessage(initialCardList.head).send
      card1_battle = ConvertCardTemplateToBattleCard(card1)
      card2 <- GetCardTemplateByIDMessage(initialCardList(1)).send
      card2_battle = ConvertCardTemplateToBattleCard(card2)
      card3 <- GetCardTemplateByIDMessage(initialCardList(2)).send
      card3_battle = ConvertCardTemplateToBattleCard(card3)
      _ <- IO {
        val newPlayerState = PlayerState(playerId = playerId, username = userName, health = 6, energy = 0, rank = "黑铁", cards = List(card1_battle, card2_battle, card3_battle), isReady = false, isConnected = true)
        gameState match {
          case Some(state) =>
            if (state.player1.playerId.nonEmpty && state.player1.playerId != playerId && state.player2.playerId.isEmpty) {
              val updatedState = state.copy(player2 = newPlayerState)
              gameState = Some(updatedState)
              broadcast(WebSocketMessage("game_state", updatedState.asJson))
            }
          case None =>
            val newState = GameState(roomId = roomId, player1 = newPlayerState, player2 = PlayerState(playerId = "", username = "Waiting for opponent...", health = 6, energy = 0, rank = "", cards = List(), isConnected = false), currentRound = 1, roundPhase = "waiting", winner = None)
            gameState = Some(newState)
            broadcast(WebSocketMessage("game_state", newState.asJson))
        }
      }
    } yield ()).handleErrorWith { error =>
      IO {
        val newPlayerState = PlayerState(playerId = playerId, username = s"Error initializing player $playerId in room $roomId from backend", health = 6, energy = 0, rank = "黑铁", cards = List(), isReady = false, isConnected = true)
        gameState match {
          case Some(state) =>
            if (state.player1.playerId.nonEmpty && state.player1.playerId != playerId && state.player2.playerId.isEmpty) {
              val updatedState = state.copy(player2 = newPlayerState)
              gameState = Some(updatedState)
              broadcast(WebSocketMessage("game_state", updatedState.asJson))
            }
          case None =>
        }
      }
    }
  }
  
  private def checkAndStartGame: Unit = {
    gameState.foreach { state =>
      if (state.player1.isReady && state.player2.isReady) {
        val updatedState = state.copy(roundPhase = "action", player1 = state.player1.copy(remainingTime = 3000, hasActed = false), player2 = state.player2.copy(remainingTime = 3000, hasActed = false))
        gameState = Some(updatedState)
        broadcastGameState(updatedState)
      }
    }
  }

  def broadcastGameState(state: GameState): IO[Unit] = IO {
    gameState = Some(state)
    broadcast(WebSocketMessage("game_state", state.asJson))
  }

  def broadcast(message: WebSocketMessage): Unit = {
    val jsonMessage = message.asJson.noSpaces
    connections.foreach { case (playerId, queue) =>
      queue.offer(WebSocketFrame.Text(jsonMessage)).attempt.unsafeRunSync() match {
        case Right(_) => 
        case Left(error) => connections.remove(playerId)
      }
    }
  }

  private def broadcastExcept(message: WebSocketMessage, exceptPlayerId: String): Unit = {
    val jsonMessage = message.asJson.noSpaces
    connections.foreach { case (playerId, queue) =>
      if (playerId != exceptPlayerId) {
        queue.offer(WebSocketFrame.Text(jsonMessage)).attempt.unsafeRunSync() match {
          case Right(_) => 
          case Left(error) => connections.remove(playerId)
        }
      }
    }
  }

  private def sendToPlayer(playerId: String, message: WebSocketMessage): Unit = {
    val jsonMessage = message.asJson.noSpaces
    connections.get(playerId).foreach { queue =>
      queue.offer(WebSocketFrame.Text(jsonMessage)).attempt.unsafeRunSync() match {
        case Right(_) => 
        case Left(error) => connections.remove(playerId)
      }
    }
  }

  def getGameState: Option[GameState] = gameState
  def getPlayerAction(playerId: String): Option[BattleAction] = currentActions.get(playerId)
  case class WebSocketMessage(`type`: String, data: Json)
}
