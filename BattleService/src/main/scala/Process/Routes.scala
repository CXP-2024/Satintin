
package Process

import APIs.UserService.GetUserInfoMessage
import Common.API.PlanContext
import Common.DBAPI.DidRollbackException
import cats.effect.*
import fs2.concurrent.Topic
import io.circe.*
import io.circe.derivation.Configuration
import io.circe.generic.auto.*
import io.circe.parser.decode
import io.circe.syntax.*
import org.http4s.*
import org.http4s.client.Client
import org.http4s.dsl.io.*

import scala.collection.concurrent.TrieMap
import Common.Serialize.CustomColumnTypes.*
import Impl.CreateBattleRoomMessagePlanner
import Impl.SubmitPlayerActionMessagePlanner
import Impl.SubmitSimultaneousActionsMessagePlanner
import Common.API.TraceID
import org.joda.time.DateTime
import org.http4s.circe.*

import java.util.UUID
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import org.http4s.headers.`Content-Type`
import fs2.Stream
import org.http4s.websocket.WebSocketFrame
import cats.effect.std.Queue
import org.http4s.server.websocket.WebSocketBuilder
import cats.syntax.semigroupk.*
import Utils.BattleWebSocketManager
import Utils.BattleRoomTicker
import Objects.BattleService.{BattleAction, CardEffect, GameOverResult, GameState, PlayerState, RoundResult}
import Utils.BattleRoomTicker.getClass
import org.slf4j.LoggerFactory

object Routes:
  val projects: TrieMap[String, Topic[IO, String]] = TrieMap.empty

  // WebSocket connections by room ID
  val battleRooms: TrieMap[String, BattleWebSocketManager] = TrieMap.empty

  def updateBattleRoom(roomId: String, gameState: GameState): IO[Unit] = {
    battleRooms.get(roomId) match {
      case Some(manager) => 
        manager.broadcastGameState(gameState)
      case None => 
        IO.unit // Room not found, do nothing
    }
  }

  private def executePlan(messageType: String, str: String): IO[String] =
    messageType match {
      case "CreateBattleRoomMessage" =>
        IO(
          decode[CreateBattleRoomMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for CreateBattleRoomMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten

      case "SubmitPlayerActionMessage" =>
        IO(
          decode[SubmitPlayerActionMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for SubmitPlayerActionMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten

      case "SubmitSimultaneousActionsMessage" =>
        IO(
          decode[SubmitSimultaneousActionsMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for SubmitSimultaneousActionsMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten


      case "test" =>
        for {
          output  <- Utils.Test.test(str)(using  PlanContext(TraceID(""), 0))
        } yield output
      case _ =>
        IO.raiseError(new Exception(s"Unknown type: $messageType"))
    }

  def handlePostRequest(req: Request[IO]): IO[String] = {
    req.as[Json].map {
      bodyJson => {
        val planContext = PlanContext(TraceID(UUID.randomUUID().toString), transactionLevel = 0)
        val planContextJson = planContext.asJson
        val updatedJson = bodyJson.deepMerge(Json.obj("planContext" -> planContextJson))
        updatedJson.toString
      }
    }
  }

  def serviceWithWebSocket(wsBuilder: WebSocketBuilder[IO]): HttpRoutes[IO] = {
    import org.http4s.websocket.WebSocketFrame
    import fs2.Stream
    import cats.effect.std.Queue

    val websocketRoute = HttpRoutes.of[IO] {
      // Battle WebSocket endpoint
      case GET -> Root / "battle" / roomId :? TokenQueryParamMatcher(token) =>
        val logger = LoggerFactory.getLogger(getClass)
        logger.info(s"WebSocket connection request for room: $roomId with token: $token")

        // Validate token and get user ID
        validateToken(token).flatMap {
          case Some(userId) =>
            logger.info(s"Token validated for user: $userId")

            // Get or create room manager
            val manager = battleRooms.getOrElseUpdate(roomId, new BattleWebSocketManager(roomId))

            // Create a queue for this connection
            for {
              queue <- Queue.unbounded[IO, WebSocketFrame]
              _ <- IO(logger.info(s"Created queue for user $userId"))

              // Register connection with room manager
              _ <- manager.addConnection(userId, queue)
              _ <- IO(logger.info(s"Added connection for user $userId"))

              // Build WebSocket
              response <- wsBuilder.build(
                // Handle incoming messages
                receive = s => s.evalMap {
                  case WebSocketFrame.Text(msg, _) =>
                    for {
                      _ <- IO(logger.info(s"Received message from user $userId: $msg"))
                      _ <- handleWebSocketMessage(roomId, userId, msg)
                    } yield ()
                  case frame =>
                    IO(logger.info(s"Received non-text frame from user $userId: ${frame.getClass.getSimpleName}"))
                }.onFinalize(
                  // 当 WebSocket 流结束时，清理连接
                  IO(logger.info(s"WebSocket connection closed for user $userId")) >> 
                  manager.removeConnection(userId)
                ),
                // Send messages from queue
                send = Stream.fromQueueUnterminated(queue)
              )
              _ <- IO(logger.info(s"WebSocket built successfully for user $userId"))
            } yield response

          case None =>
            logger.warn(s"Invalid token: $token")
            BadRequest("Invalid token")
        }
    }

    // Combine existing Routes.service and WebSocket routes
    service <+> websocketRoute
  }

  // Extract token from query parameters
  object TokenQueryParamMatcher extends QueryParamDecoderMatcher[String]("token")

  // Validate token and return user ID if valid
  private def validateToken(token: String): IO[Option[String]] = {
    // In a real implementation, this would validate the token with UserService
    // For now, since the user token is just the user ID, we can simulate validation. Also, later we'll get username from UserService, which will validate the token format
    IO.pure(Some(token))
  }

  // Handle WebSocket messages
  private def handleWebSocketMessage(roomId: String, userId: String, message: String): IO[Unit] = {
    val logger = LoggerFactory.getLogger(getClass)

    // Parse message
    decode[WebSocketMessage](message) match {
      case Right(wsMessage) =>
        logger.info(s"Parsed WebSocket message: ${wsMessage.`type`}")

        wsMessage.`type` match {
          case "player_action" =>
            // Handle player action
            wsMessage.data match {
              case Some(dataJson) =>
                for {
                  _ <- IO(logger.info(s"Processing player action from user $userId"))
                  action <- IO.fromEither(decode[BattleAction](dataJson.noSpaces))
                  _ <- processPlayerAction(roomId, userId, action)
                } yield ()
              case None =>
                IO(logger.error(s"player_action message missing data field"))
            }

          case "player_ready" =>
            // Handle player ready
            for {
              _ <- IO(logger.info(s"Player $userId is ready"))
              _ <- setPlayerReady(roomId, userId)
            } yield ()

          case _ =>
            IO(logger.warn(s"Unknown message type: ${wsMessage.`type`}"))
        }

      case Left(error) =>
        IO(logger.error(s"Failed to parse WebSocket message: $error"))
    }
  }

  // Process player action
  private def processPlayerAction(roomId: String, userId: String, action: BattleAction): IO[Unit] = {
    val logger = LoggerFactory.getLogger(getClass)
    logger.info(s"Processing action: $action for user $userId in room $roomId")

    battleRooms.get(roomId) match {
      case Some(manager) =>
        // Record the action
        manager.recordPlayerAction(userId, action) >>
        // Check if both players have submitted actions
        manager.checkAndProcessActions

      case None =>
        IO(logger.warn(s"Room not found: $roomId"))
    }
  }

  // Set player ready
  private def setPlayerReady(roomId: String, userId: String): IO[Unit] = {
    val logger = LoggerFactory.getLogger(getClass)
    logger.info(s"Setting player $userId as ready in room $roomId")

    battleRooms.get(roomId) match {
      case Some(manager) =>
        manager.setPlayerReady(userId)

      case None =>
        IO(logger.warn(s"Room not found: $roomId"))
    }
  }

  // WebSocket message structure
  case class WebSocketMessage(`type`: String, data: Option[Json] = None)

  val service: HttpRoutes[IO] = HttpRoutes.of[IO] {
    case GET -> Root / "health" =>
      Ok("OK")

    case GET -> Root / "stream" / projectName =>
      projects.get(projectName) match {
        case Some(topic) =>
          val stream = topic.subscribe(10)
          Ok(stream)
        case None =>
          Topic[IO, String].flatMap { topic =>
            projects.putIfAbsent(projectName, topic) match {
              case None =>
                val stream = topic.subscribe(10)
                Ok(stream)
              case Some(existingTopic) =>
                val stream = existingTopic.subscribe(10)
                Ok(stream)
            }
          }
      }
    case req@POST -> Root / "api" / name =>
      handlePostRequest(req).flatMap {
        executePlan(name, _)
      }.flatMap(Ok(_))
      .handleErrorWith {
        case e: DidRollbackException =>
          println(s"Rollback error: $e")
          val headers = Headers("X-DidRollback" -> "true")
          BadRequest(e.getMessage.asJson.toString).map(_.withHeaders(headers))

        case e: Throwable =>
          println(s"General error: $e")
          BadRequest(e.getMessage.asJson.toString)
      }
  }
