package Process

import Common.API.PlanContext
import Common.DBAPI.DidRollbackException
import cats.effect.*
import fs2.concurrent.Topic
import io.circe.*
import io.circe.derivation.Configuration
import io.circe.generic.auto.*
import io.circe.parser.decode
import io.circe.parser.parse
import io.circe.syntax.*
import org.http4s.*
import org.http4s.client.Client
import org.http4s.dsl.io.*
import scala.collection.concurrent.TrieMap
import Common.Serialize.CustomColumnTypes.*
import Impl.ModifyUserStatusMessagePlanner
import Impl.ModifyUserInfoMessagePlanner
import Impl.AddFriendMessagePlanner
import Impl.RegisterUserMessagePlanner
import Impl.RemoveFriendMessagePlanner
import Impl.LogUserOperationMessagePlanner
import Impl.LoginUserMessagePlanner
import Impl.AcceptFriendRequestMessagePlanner
import Impl.GetUserStatusMessagePlanner
import Impl.BlockUserMessagePlanner
import Impl.LogoutUserMessagePlanner
import Impl.ReceiveMessagesMessagePlanner
import Impl.GetUserInfoMessagePlanner
import Impl.ValidateUserTokenMessagePlanner
import Impl.CheckUserTokenValidityMessagePlanner
import Common.API.TraceID
import org.joda.time.DateTime
import org.http4s.circe.*
import java.util.UUID
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

object Routes:
  val projects: TrieMap[String, Topic[IO, String]] = TrieMap.empty

  private def executePlan(messageType: String, str: String): IO[String] =
    messageType match {
      case "ModifyUserStatusMessage" =>
        IO(
          decode[ModifyUserStatusMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for ModifyUserStatusMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "ModifyUserInfoMessage" =>
        IO(
          decode[ModifyUserInfoMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for ModifyUserInfoMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "AddFriendMessage" =>
        IO(
          decode[AddFriendMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for AddFriendMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "RegisterUserMessage" =>
        IO(
          decode[RegisterUserMessagePlanner](str) match
            case Left(err) => 
              err.printStackTrace()
              throw new Exception(s"Invalid JSON for RegisterUserMessage[${err.getMessage}]")
            case Right(planner) => 
              planner.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "RemoveFriendMessage" =>
        IO(
          decode[RemoveFriendMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for RemoveFriendMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "LogUserOperationMessage" =>
        IO(
          decode[LogUserOperationMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for LogUserOperationMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "LoginUserMessage" =>
        IO(
          decode[LoginUserMessagePlanner](str) match
            case Left(err) => 
              err.printStackTrace(); 
              throw new Exception(s"Invalid JSON for LoginUserMessage[${err.getMessage}]")
            case Right(value) => 
              value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "AcceptFriendRequestMessage" =>
        IO(
          decode[AcceptFriendRequestMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for AcceptFriendRequestMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "GetUserStatusMessage" =>
        IO(
          decode[GetUserStatusMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for GetUserStatusMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "BlockUserMessage" =>
        IO(
          decode[BlockUserMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for BlockUserMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "LogoutUserMessage" =>
        IO(
          decode[LogoutUserMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for LogoutUserMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "ReceiveMessagesMessage" =>
        IO(
          decode[ReceiveMessagesMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for ReceiveMessagesMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "GetUserInfoMessage" =>
        IO(
          decode[GetUserInfoMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for GetUserInfoMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "ValidateUserTokenMessage" =>
        IO(
          decode[ValidateUserTokenMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for ValidateUserTokenMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
       
      case "CheckUserTokenValidityMessage" =>
        IO(
          decode[CheckUserTokenValidityMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for CheckUserTokenValidityMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten

      case "test" =>
        for {
          output  <- Utils.Test.test(str)(using  PlanContext(TraceID(""), 0))
        } yield output
      case "FetchUserStatusMessage" =>
        IO(
          decode[FetchUserStatusMessagePlanner](str) match
            case Left(err) => err.printStackTrace(); throw new Exception(s"Invalid JSON for FetchUserStatusMessage[${err.getMessage}]")
            case Right(value) => value.fullPlan.map(_.asJson.toString)
        ).flatten
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
    case GET -> Root / "health"    => Ok("OK")
    case GET -> Root / "stream" / p => projects.get(p) match {
        case Some(topic) =>
          val stream = topic.subscribe(10)
          Ok(stream)
        case None =>
          Topic[IO, String].flatMap { topic =>
            projects.putIfAbsent(p, topic) match {
              case None =>
                val stream = topic.subscribe(10)
                Ok(stream)
              case Some(existingTopic) =>
                val stream = existingTopic.subscribe(10)
                Ok(stream)
            }
          }
      }
    case req @ POST -> Root / "api" / name =>
      (for {
        // 1) 读取 + merge PlanContext
        bodyWithCtx <- handlePostRequest(req)

        // 2) 执行 Planner, 拿到 JSON 字符串
        resultStr   <- executePlan(name, bodyWithCtx)

        // 3) parse 成真正的 Json
        resultJson  <- parse(resultStr) match {
                         case Left(e)   => IO.raiseError(e)
                         case Right(js) => IO.pure(js)
                       }

        // 4) 返回 Json
        resp        <- Ok(resultJson)
      } yield resp).handleErrorWith {
        case e: DidRollbackException =>
          println(s"Rollback error: $e")
          val headers = Headers("X-DidRollback" -> "true")
          BadRequest(e.getMessage.asJson.toString).map(_.withHeaders(headers))

        case e: Throwable =>
          println(s"General error: $e")
          BadRequest(e.getMessage.asJson.toString)
      }
  }
