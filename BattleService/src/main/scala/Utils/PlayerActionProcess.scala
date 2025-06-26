package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import cats.implicits._
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.BattleService.PlayerStatus
import Objects.BattleService.ActionEntry
import Objects.CardService.CardEntry
import Objects.BattleService.BattleState
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import io.circe.Json
import Common.API.PlanContext
import Common.DBAPI.{readDBJsonOptional, writeDB}
import Objects.AdminService.ActionType
import io.circe.syntax.*
import io.circe.generic.auto.*
import Objects.UserService.MessageEntry
import Objects.UserService.User
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import Common.DBAPI.{readDBJson, writeDB}

case object PlayerActionProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  def evaluateRoundResult(roomID: String)(using PlanContext): IO[BattleState] = {
  
    for {
      // Step 1: Get current room information from BattleRoomTable
      _ <- IO(logger.info(s"Fetching room information for roomID = ${roomID}"))
      roomSql <- IO {
        s"""
           SELECT room_id, player_one_id, player_two_id
           FROM ${schemaName}.battle_room_table
           WHERE room_id = ?
         """
      }
      roomInfoJson <- readDBJson(roomSql, List(SqlParameter("String", roomID)))
      playerOneID <- IO { decodeField[String](roomInfoJson, "player_one_id") }
      playerTwoID <- IO { decodeField[String](roomInfoJson, "player_two_id") }
  
      // Step 2: Retrieve all player actions for current round from BattleActionTable
      _ <- IO(logger.info(s"Fetching actions for roomID = ${roomID}"))
      actionsSql <- IO {
        s"""
           SELECT action_id, player_id, action_type, target_id
           FROM ${schemaName}.battle_action_table
           WHERE room_id = ?
         """
      }
      actionEntriesJsonList <- readDBRows(actionsSql, List(SqlParameter("String", roomID)))
      actionEntries <- IO { actionEntriesJsonList.map(decodeType[ActionEntry]) }
  
      // Step 3: Validate and Parse Player Actions
      _ <- IO(logger.info(s"Validating actions for roomID = ${roomID}"))
      validActions <- IO {
        actionEntries.groupBy(_.playerID).flatMap { case (playerID, actions) =>
          if (actions.size > 1)
            throw new IllegalStateException(s"Player ${playerID} submitted multiple actions in the same round!")
          if (actions.isEmpty)
            None
          else
            Some(actions.head)
        }.toList
      }
  
      _ <- IO(logger.info(s"Valid actions for roomID = ${roomID}: ${validActions}"))
  
      // Step 4: Fetch and Decode Current BattleState
      _ <- IO(logger.info(s"Fetching battle state for roomID = ${roomID}"))
      battleStateSql <- IO {
        s"""
           SELECT current_round, round_phase, remaining_time, player_one_status, player_two_status
           FROM ${schemaName}.battle_state_table
           WHERE room_id = ?
         """
      }
      battleStateJson <- readDBJson(battleStateSql, List(SqlParameter("String", roomID)))
  
      currentRound <- IO { decodeField[Int](battleStateJson, "current_round") }
      roundPhase <- IO { decodeField[String](battleStateJson, "round_phase") }
      remainingTime <- IO { decodeField[Int](battleStateJson, "remaining_time") }
      playerOneStatusJson <- IO { decodeField[String](battleStateJson, "player_one_status") }
      playerTwoStatusJson <- IO { decodeField[String](battleStateJson, "player_two_status") }
      playerOneStatus <- IO { decodeType[PlayerStatus](playerOneStatusJson) }
      playerTwoStatus <- IO { decodeType[PlayerStatus](playerTwoStatusJson) }
  
      // Step 5: Update BattleState Based on Valid Actions
      updatedPlayerOneStatus <- IO {
        validActions.find(_.playerID == playerOneID).map { action =>
          logger.info(s"Updating Player One (ID = ${playerOneID}) status based on action: ${action}")
          val updatedHealth = playerOneStatus.health - 10 // Example update logic
          playerOneStatus.copy(health = updatedHealth)
        }.getOrElse(playerOneStatus)
      }
  
      updatedPlayerTwoStatus <- IO {
        validActions.find(_.playerID == playerTwoID).map { action =>
          logger.info(s"Updating Player Two (ID = ${playerTwoID}) status based on action: ${action}")
          val updatedEnergy = playerTwoStatus.energy + 5 // Example update logic
          playerTwoStatus.copy(energy = updatedEnergy)
        }.getOrElse(playerTwoStatus)
      }
  
      updatedBattleState <- IO {
        BattleState(
          currentRound,
          roundPhase,
          remainingTime,
          updatedPlayerOneStatus,
          updatedPlayerTwoStatus
        )
      }
  
      _ <- IO(logger.info(s"Updated BattleState: ${updatedBattleState.asJson.noSpaces}"))
  
      // Step 6: Persist Updated BattleState Back to BattleStateTable
      _ <- IO(logger.info(s"Persisting updated BattleState for roomID = ${roomID}"))
      updateBattleStateSql <- IO {
        s"""
           UPDATE ${schemaName}.battle_state_table
           SET player_one_status = ?, player_two_status = ?
           WHERE room_id = ?
         """
      }
      updateParams <- IO {
        List(
          SqlParameter("String", updatedPlayerOneStatus.asJson.noSpaces),
          SqlParameter("String", updatedPlayerTwoStatus.asJson.noSpaces),
          SqlParameter("String", roomID)
        )
      }
      _ <- writeDB(updateBattleStateSql, updateParams)
      _ <- IO(logger.info(s"Successfully updated BattleState for roomID = ${roomID}"))
  
    } yield updatedBattleState
  }
  
  def submitPlayerAction(
      playerID: String,
      roomID: String,
      actionType: String,
      targetID: Option[String]
  )(using PlanContext): IO[String] = {
  
  // val logger = LoggerFactory.getLogger(getClass)  // 同文后端处理: logger 统一
    logger.info(s"开始执行submitPlayerAction方法，传入参数：playerID=${playerID}, roomID=${roomID}, actionType=${actionType}, targetID=${targetID}")
  
    val currentTime = DateTime.now()
  
    for {
      // Step 1.1 验证 playerID 是否存在
      _ <- IO(logger.info(s"验证 playerID=${playerID} 是否存在"))
      playerExists <- readDBJsonOptional(
        s"SELECT user_id FROM ${schemaName}.user WHERE user_id = ?",
        List(SqlParameter("String", playerID))
      ).map(_.isDefined)
      _ <- if (!playerExists) IO.raiseError(new IllegalArgumentException(s"玩家ID不存在：playerID=${playerID}")) else IO.unit
  
      // Step 1.2 验证 roomID 是否存在，且房间状态未结束
      _ <- IO(logger.info(s"验证 roomID=${roomID} 是否存在 且状态允许记录行为"))
      roomExistsAndValid <- readDBJsonOptional(
        s"SELECT winner_id FROM ${schemaName}.battle_room_table WHERE room_id = ?",
        List(SqlParameter("String", roomID))
      ).map {
        case Some(json) => decodeField[Option[String]](json, "winner_id").isEmpty
        case None => false
      }
      _ <- if (!roomExistsAndValid) IO.raiseError(new IllegalArgumentException(s"房间不存在或已结束：roomID=${roomID}")) else IO.unit
  
      // Step 1.3 检查 actionType 是否为有效值
      _ <- IO(logger.info(s"检查 actionType=${actionType} 是否有效"))
      _ <- IO {
        if (!List("Pancake", "Defense", "Spray").contains(actionType)) 
          throw new IllegalArgumentException(s"无效的操作类型：actionType=${actionType}")
      }
      actionTypeEnum <- IO(ActionType.fromString(actionType))
  
      // Step 2.1 创建行为记录并存储到数据库
      actionID <- IO(java.util.UUID.randomUUID().toString)
      _ <- IO(logger.info(s"创建行为记录 actionID=${actionID}, playerID=${playerID}, roomID=${roomID}, actionType=${actionType}, targetID=${targetID}"))
      _ <- writeDB(
        s"""
        INSERT INTO ${schemaName}.battle_action_table (action_id, room_id, player_id, action_type, target_id, action_time)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        List(
          SqlParameter("String", actionID),
          SqlParameter("String", roomID),
          SqlParameter("String", playerID),
          SqlParameter("String", actionTypeEnum.toString),
          SqlParameter("String", targetID.getOrElse(null)),
          SqlParameter("Long", currentTime.getMillis.toString)
        )
      )
  
      // Step 2.2 (如果有额外的状态更新逻辑，这里可以处理)
      _ <- IO(logger.info("行为记录已成功存储，若有额外更新操作，请在这里实现"))
  
    } yield {
      // Step 3.1 返回处理结果
      val resultMessage = "玩家行为已记录!"
      logger.info(resultMessage)
      resultMessage
    }
  }
}
