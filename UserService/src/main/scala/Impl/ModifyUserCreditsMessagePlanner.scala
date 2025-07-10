package Impl

import Common.API.{PlanContext, Planner}
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.UserAuthenticationProcess.authenticateUser
import Objects.UserService.User
import org.slf4j.LoggerFactory
import cats.effect.IO
import io.circe._
import io.circe.generic.auto._
import cats.implicits._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.UserService.MessageEntry
import Objects.UserService.BlackEntry
import io.circe.syntax._
import Objects.UserService.FriendEntry
import Utils.UserTokenValidator
import Common.RankConstants

case class ModifyUserCreditsMessagePlanner(
    userID: String,
    targetCredits: Int,
    override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  private def decodeField[T](json: Json, field: String)(implicit decoder: Decoder[T]): T = {
    json.hcursor.downField(field).as[T] match {
      case Right(value) => value
      case Left(error) =>
        logger.error(s"Error decoding field $field: $error")
        throw new RuntimeException(s"Error decoding field $field: $error")
    }
  }

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: 验证输入参数
      _ <- IO(logger.info(s"[Step 1] 验证输入参数"))
      _ <- validateInputParameters(targetCredits)

      // Step 2: 检查用户是否存在
      _ <- IO(logger.info(s"[Step 2] 检查用户是否存在"))
      _ <- checkUserExists(userID)

      // Step 3: 更新用户积分和段位信息
      _ <- IO(logger.info(s"[Step 3] 更新用户积分和段位信息"))
      _ <- updateUserCredits(userID, targetCredits)

      // Step 4: 返回成功提示
      _ <- IO(logger.info(s"用户ID: ${userID} 积分修改成功！"))
    } yield "积分更新成功"
  }

  // --- Step 1: 验证输入参数 ---
  private def validateInputParameters(credits: Int)(using PlanContext): IO[Unit] = {
    IO {
      if (credits < 0) {
        val errorMsg = s"积分不能为负数: ${credits}"
        logger.error(errorMsg)
        throw new IllegalArgumentException(errorMsg)
      }
    }
  }

  // --- Step 2: 检查用户是否存在 ---
  private def checkUserExists(userID: String)(using PlanContext): IO[Unit] = {
    for {
      jsonOpt <- readDBJsonOptional(
        s"""
        SELECT EXISTS (
          SELECT 1 FROM "${schemaName}"."user_table"
          WHERE user_id = ?
        ) as exists
        """,
        List(SqlParameter("String", userID))
      )
      exists = jsonOpt match {
        case Some(json) => decodeField[Boolean](json, "exists")
        case None => false
      }
      _ <- IO {
        if (!exists) {
          val errorMsg = s"用户不存在: ${userID}"
          logger.error(errorMsg)
          throw new IllegalArgumentException(errorMsg)
        }
      }
    } yield ()
  }

  // --- Step 3: 更新用户积分和段位信息 ---
  private def updateUserCredits(userID: String, credits: Int)(using PlanContext): IO[Unit] = {
    val (newRank, rankPosition) = RankConstants.getRankInfoByCredits(credits)

    for {
      _ <- IO(logger.info(s"计算新段位信息 - 段位: ${newRank.name}, 位置: ${rankPosition}"))
      dbResult <- writeDB(
        s"""
        INSERT INTO "${schemaName}"."user_rank_table" (user_id, credits, rank, rank_position)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (user_id)
        DO UPDATE SET
          credits = ?,
          rank = ?,
          rank_position = ?
        """,
        List(
          SqlParameter("String", userID),
          SqlParameter("Int", credits.toString),
          SqlParameter("String", newRank.name),
          SqlParameter("Int", rankPosition.toString),
          SqlParameter("Int", credits.toString),
          SqlParameter("String", newRank.name),
          SqlParameter("Int", rankPosition.toString)
        )
      )
      _ <- IO {
        if (dbResult == "Operation(s) done successfully") {
          logger.info(s"用户ID: ${userID} 的积分和段位更新成功")
        } else {
          val errorMsg = s"更新操作未成功，返回信息: ${dbResult}"
          logger.error(errorMsg)
          throw new RuntimeException(errorMsg)
        }
      }
    } yield ()
  }
} 