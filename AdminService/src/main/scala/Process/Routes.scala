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
import Impl.BanUserMessagePlanner
import Impl.CreateAdminMessagePlanner
import Impl.LoginAdminMessagePlanner
import Impl.ManageReportMessagePlanner
import Impl.UnbanUserMessagePlanner
import Impl.ViewSystemStatsMessagePlanner
import Impl.CreateReportUserMessagePlanner
import Impl.ViewAllReportsMessagePlanner
import APIs.AdminService.CreateReportMessage
import Common.API.TraceID
import org.joda.time.DateTime
import org.http4s.circe.*
import java.util.UUID
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

object Routes:
  val projects: TrieMap[String, Topic[IO, String]] = TrieMap.empty

  private def executePlan(messageType: String, str: String): IO[String] =
    messageType match {
      case "BanUserMessage" =>
        IO(
          decode[BanUserMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for BanUserMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "ManageReportMessage" =>
        IO(
          decode[ManageReportMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for ManageReportMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "UnbanUserMessage" =>
        IO(
          decode[UnbanUserMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for UnbanUserMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "ViewSystemStatsMessage" =>
        IO(
          decode[ViewSystemStatsMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for ViewSystemStatsMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       

      case "LoginAdminMessage" =>
        IO(
          decode[LoginAdminMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for LoginAdminMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten

      case "CreateAdminMessage" =>
        IO(
          decode[CreateAdminMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for CreateAdminMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
      
      case "CreateReportMessage" =>
        IO(
          decode[CreateReportUserMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for CreateReportMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten

      case "ViewAllReportsMessage" =>
        IO(
          decode[ViewAllReportsMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for ViewAllReportsMessage[${err.getMessage}]")
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
