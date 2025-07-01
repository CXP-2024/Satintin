
package Process

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
import Impl.QueryBooksMessagePlanner
import Impl.DeleteBookMessagePlanner
import Impl.AddBookMessagePlanner
import Impl.UpdateBookInfoMessagePlanner
import Impl.GetBookInfoMessagePlanner
import Common.API.TraceID
import org.joda.time.DateTime
import org.http4s.circe.*

import java.util.UUID
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import org.http4s.headers.`Content-Type`
import fs2.Stream
import org.http4s.websocket.WebSocketFrame
import cats.effect.std.Queue
import org.http4s.server.websocket.{WebSocketBuilder, WebSocketBuilder2}
import cats.syntax.semigroupk.*

object Routes:
  val projects: TrieMap[String, Topic[IO, String]] = TrieMap.empty
  def updateProject(projectID: String, update: String): IO[Unit] = {
    println(s"updateProject--------------- ${projectID}")
    projects.get(projectID) match {
      case Some(topic) =>
        println("publish it!")
        topic.publish1("data: " + update + "\n\n") >> IO.unit
      case None => IO.unit // No subscribers yet, do nothing.
    }
  }

  private def executePlan(messageType: String, str: String): IO[String] =
    messageType match {
      case "QueryBooksMessage" =>
        IO(
          decode[QueryBooksMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for QueryBooksMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "DeleteBookMessage" =>
        IO(
          decode[DeleteBookMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for DeleteBookMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "AddBookMessage" =>
        IO(
          decode[AddBookMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for AddBookMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "UpdateBookInfoMessage" =>
        IO(
          decode[UpdateBookInfoMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for UpdateBookInfoMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "GetBookInfoMessage" =>
        IO(
          decode[GetBookInfoMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for GetBookInfoMessage[${err.getMessage}]")
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
      case GET -> Root / "ws" =>
        for {
          queue <- Queue.unbounded[IO, WebSocketFrame]
          response <- wsBuilder.build(
            receive = _.evalMap {
              case WebSocketFrame.Text(msg, _) =>
                IO.println(s"收到客户端消息: $msg") >> queue.offer(WebSocketFrame.Text(s"echo: $msg"))
              case _ => IO.unit
            },
            send = Stream.fromQueueUnterminated(queue)
          )
        } yield response
    }

    // 合并原有的 Routes.service 和 WebSocket 路由
    service <+> websocketRoute
  }
  val service: HttpRoutes[IO] = HttpRoutes.of[IO] {
    case GET -> Root / "health" =>
      Ok("OK")
    case GET -> Root / "stream" / projectName =>
      println("got request!")
      (projects.get(projectName) match {
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
      }).map(_.withHeaders(`Content-Type`(MediaType.unsafeParse("text/event-stream"))))
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
  