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
import Impl.CreateAssetTransactionMessagePlanner
import Impl.RewardAssetMessagePlanner
import Impl.DeductAssetMessagePlanner
import Impl.QueryAssetStatusMessagePlanner
import Impl.UpdateCardDrawCountMessagePlanner
import Impl.QueryCardDrawCountMessagePlanner
import Impl.GetAssetTransactionMessagePlanner
import Common.API.TraceID
import org.joda.time.DateTime
import org.http4s.circe.*
import java.util.UUID
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

object Routes:
  val projects: TrieMap[String, Topic[IO, String]] = TrieMap.empty

  private def executePlan(messageType: String, str: String): IO[String] =
    messageType match {
      case "CreateAssetTransactionMessage" =>
        IO(
          decode[CreateAssetTransactionMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for CreateAssetTransactionMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "RewardAssetMessage" =>
        IO(
          decode[RewardAssetMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for RewardAssetMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "DeductAssetMessage" =>        IO(
          decode[DeductAssetMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for DeductAssetMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
        
      case "QueryAssetStatusMessage" =>
        IO(
          decode[QueryAssetStatusMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for QueryAssetStatusMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "UpdateCardDrawCountMessage" =>
        IO(
          decode[UpdateCardDrawCountMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for UpdateCardDrawCountMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "QueryCardDrawCountMessage" =>
        IO(
          decode[QueryCardDrawCountMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for QueryCardDrawCountMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "GetAssetTransactionMessage" =>
        IO(
          decode[GetAssetTransactionMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for GetAssetTransactionMessage[${err.getMessage}]")
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
