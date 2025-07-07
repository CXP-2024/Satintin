package Impl

import Common.API.{PlanContext, Planner}
import Objects.AdminService.ActionType
import APIs.UserService.ValidateUserTokenMessage
import Utils.PlayerActionProcess.processSimultaneousActions
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
import Common.DBAPI.*
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Common.ServiceUtils.schemaName

case class SubmitSimultaneousActionsMessagePlanner(
    player1Token: String,
    player1ActionType: String,
    player1TargetID: Option[String],
    player2Token: String,
    player2ActionType: String,
    player2TargetID: Option[String],
    roomID: String,
    override val planContext: PlanContext
) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  /**
   * 主Plan方法
   */  override def plan(using PlanContext): IO[String] = {
    logger.info(s"开始处理同时提交的玩家行为：roomID=${roomID}")
    logger.info(s"Player1: token=${player1Token}, action=${player1ActionType}, target=${player1TargetID}")
    logger.info(s"Player2: token=${player2Token}, action=${player2ActionType}, target=${player2TargetID}")
    
    for {
      // Step 1: 验证两个玩家的token并获取用户ID
      player1ID <- ValidateUserTokenMessage(player1Token).send.flatMap { userID =>
        if (userID == null || userID.isEmpty) {
          IO.raiseError(new SecurityException(s"Player1 Token无效: ${player1Token}"))
        } else {
          IO.pure(userID)
        }
      }
      
      player2ID <- ValidateUserTokenMessage(player2Token).send.flatMap { userID =>
        if (userID == null || userID.isEmpty) {
          IO.raiseError(new SecurityException(s"Player2 Token无效: ${player2Token}"))
        } else {
          IO.pure(userID)
        }
      }
      
      _ <- IO(logger.info(s"Player validation successful: player1ID=${player1ID}, player2ID=${player2ID}"))
      
      // Step 2: 验证动作类型
      _ <- IO {
        val validActions = List("代表Pancake动作", "代表防御动作", "代表喷射动作")
        if (!validActions.contains(player1ActionType)) {
          throw new IllegalArgumentException(s"Invalid action type for player 1: ${player1ActionType}")
        }
        if (!validActions.contains(player2ActionType)) {
          throw new IllegalArgumentException(s"Invalid action type for player 2: ${player2ActionType}")
        }
      }
      
      // Step 3: 处理同时行为
      result <- processSimultaneousActions(
        roomID,
        player1ID, player1ActionType, player1TargetID,
        player2ID, player2ActionType, player2TargetID
      )
      
      _ <- IO(logger.info(s"Simultaneous actions processed successfully: ${result}"))
      
    } yield result
  }
}
