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
import Common.DBAPI.{readDBJson, readDBJsonOptional, readDBRows, writeDB}

case object PlayerActionProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  // Initialize battle state for a new room
  def initializeBattleState(roomID: String, playerOneID: String, playerTwoID: String)(using PlanContext): IO[Unit] = {
    logger.info(s"Initializing battle state for roomID=${roomID}, players: ${playerOneID}, ${playerTwoID}")
    
    val initialPlayerStatus = PlayerStatus(
      health = 6,
      energy = 0,
      actions = List.empty,
      unusedCards = List.empty
    )
    
    for {
      _ <- writeDB(
        s"""
        INSERT INTO ${schemaName}.battle_state_table (room_id, current_round, round_phase, remaining_time, player_one_status, player_two_status)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (room_id) DO NOTHING
        """,
        List(
          SqlParameter("String", roomID),
          SqlParameter("Int", "1"),
          SqlParameter("String", "waiting_for_actions"),
          SqlParameter("Int", "0"),
          SqlParameter("String", initialPlayerStatus.asJson.noSpaces),
          SqlParameter("String", initialPlayerStatus.asJson.noSpaces)
        )
      )
      _ <- IO(logger.info(s"Battle state initialized for roomID=${roomID}"))
    } yield ()
  }

  // Convert frontend action types to backend action types
  private def convertActionType(frontendAction: String): String = frontendAction match {
    case "cake" => "代表Pancake动作"
    case "defense" => "代表防御动作"
    case "spray" => "代表喷射动作"
    case _ => throw new Exception(s"Unknown frontend action type: $frontendAction")
  }

  // Process simultaneous actions from both players
  def processSimultaneousActions(
      roomID: String,
      player1ID: String, player1Action: String, player1Target: Option[String],
      player2ID: String, player2Action: String, player2Target: Option[String]
  )(using PlanContext): IO[String] = {
    logger.info(s"Processing simultaneous actions for roomID=${roomID}")
    logger.info(s"Player1: ${player1ID} -> ${player1Action}, target: ${player1Target}")
    logger.info(s"Player2: ${player2ID} -> ${player2Action}, target: ${player2Target}")
    
    val currentTime = DateTime.now()
    
    for {
      // Step 1: Record both actions
      action1ID <- IO(java.util.UUID.randomUUID().toString)
      action2ID <- IO(java.util.UUID.randomUUID().toString)
      
      // Convert frontend action types to backend action types
      player1ActionBackend <- IO(convertActionType(player1Action))
      player2ActionBackend <- IO(convertActionType(player2Action))
      
      player1ActionEnum <- IO(ActionType.fromString(player1ActionBackend))
      player2ActionEnum <- IO(ActionType.fromString(player2ActionBackend))
      
      _ <- writeDB(
        s"""
        INSERT INTO ${schemaName}.battle_action_table (action_id, room_id, player_id, action_type, target_id, action_time)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        List(
          SqlParameter("String", action1ID),
          SqlParameter("String", roomID),
          SqlParameter("String", player1ID),
          SqlParameter("String", player1ActionEnum.toString),
          SqlParameter("String", player1Target.getOrElse("")),
          SqlParameter("DateTime", currentTime.getMillis.toString)
        )
      )
      
      _ <- writeDB(
        s"""
        INSERT INTO ${schemaName}.battle_action_table (action_id, room_id, player_id, action_type, target_id, action_time)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        List(
          SqlParameter("String", action2ID),
          SqlParameter("String", roomID),
          SqlParameter("String", player2ID),
          SqlParameter("String", player2ActionEnum.toString),
          SqlParameter("String", player2Target.getOrElse("")),
          SqlParameter("DateTime", currentTime.getMillis.toString)
        )
      )
      
      // Step 2: Get current battle state
      battleStateOpt <- readDBJsonOptional(
        s"""
        SELECT current_round, player_one_status, player_two_status
        FROM ${schemaName}.battle_state_table
        WHERE room_id = ?
        """,
        List(SqlParameter("String", roomID))
      )
      
      battleStateJson <- battleStateOpt match {
        case Some(json) => IO.pure(json)
        case None => 
          // Battle state doesn't exist, initialize it
          for {
            _ <- IO(logger.info(s"Battle state not found for room ${roomID}, initializing..."))
            _ <- initializeBattleState(roomID, player1ID, player2ID)
            // Now read the initialized state
            json <- readDBJson(
              s"""
              SELECT current_round, player_one_status, player_two_status
              FROM ${schemaName}.battle_state_table
              WHERE room_id = ?
              """,
              List(SqlParameter("String", roomID))
            )
          } yield json
      }
      
      currentRound <- IO { decodeField[Int](battleStateJson, "current_round") }
      player1StatusJson <- IO { decodeField[String](battleStateJson, "player_one_status") }
      player2StatusJson <- IO { decodeField[String](battleStateJson, "player_two_status") }
      player1Status <- IO { decodeType[PlayerStatus](player1StatusJson) }
      player2Status <- IO { decodeType[PlayerStatus](player2StatusJson) }
      
      // Step 3: Process battle logic
      battleResult <- processBattleRound(
        player1Status, player1ActionEnum, player1Target,
        player2Status, player2ActionEnum, player2Target
      )
      
      // Step 4: Update battle state
      newRound = currentRound + 1
      _ <- writeDB(
        s"""
        UPDATE ${schemaName}.battle_state_table
        SET current_round = ?, player_one_status = ?, player_two_status = ?
        WHERE room_id = ?
        """,
        List(
          SqlParameter("Int", newRound.toString),
          SqlParameter("String", battleResult._1.asJson.noSpaces),
          SqlParameter("String", battleResult._2.asJson.noSpaces),
          SqlParameter("String", roomID)
        )
      )
      
      // Step 5: Format result message
      resultMessage = formatBattleResult(currentRound, battleResult._1, battleResult._2, battleResult._3)
      _ <- IO(logger.info(s"Round ${currentRound} completed: ${resultMessage}"))
      
    } yield resultMessage
  }
  
  // Battle logic processing
  private def processBattleRound(
      player1Status: PlayerStatus, player1Action: ActionType, player1Target: Option[String],
      player2Status: PlayerStatus, player2Action: ActionType, player2Target: Option[String]
  ): IO[(PlayerStatus, PlayerStatus, String)] = {
    
    var p1Health = player1Status.health
    var p1Energy = player1Status.energy
    var p2Health = player2Status.health
    var p2Energy = player2Status.energy
    
    val battleLog = scala.collection.mutable.ListBuffer[String]()
    
    // Process actions based on type
    (player1Action, player2Action) match {
      case (ActionType.Spray, ActionType.Spray) =>
        // Both spray - mutual damage
        p1Health -= 0
        p2Health -= 0
        p1Energy -= 1
        p2Energy -= 1
        battleLog += "Both players spray each other! Mutual damage dealt."
        
      case (ActionType.Spray, ActionType.Defense) =>
        // P1 sprays, P2 defends - reduced damage
        p2Health -= 0
        p1Energy -= 1
        p2Energy -= 0
        battleLog += "Player 1 sprays, Player 2 defends! Damage reduced."
        
      case (ActionType.Defense, ActionType.Spray) =>
        // P1 defends, P2 sprays - reduced damage
        p1Health -= 0
        p2Energy -= 1
        p1Energy -= 0
        battleLog += "Player 2 sprays, Player 1 defends! Damage reduced."
        
      case (ActionType.Pancake, ActionType.Pancake) =>
        // Both pancake - energy battle
        p1Energy += 1
        p2Energy += 1
        battleLog += "Both players use pancake! Energy restored."
        
      case (ActionType.Pancake, ActionType.Spray) =>
        // P1 pancake, P2 spray - P1 takes damage but gains energy
        p1Health -= 1
        p1Energy = 0 
        p2Energy = 0
        battleLog += "Harm done to Player 1, energy to 0"
        
      case (ActionType.Spray, ActionType.Pancake) =>
        // P1 spray, P2 pancake - P2 takes damage but gains energy
        p2Health -= 1
        p2Energy = 0 
        p1Energy = 0
        battleLog += "Harm done to Player 2, energy to 0"
        
      case (ActionType.Defense, ActionType.Defense) =>
        // Both defend - energy recovery
        p1Energy += 0
        p2Energy += 0
        battleLog += "Both players defend!"
        
      case (ActionType.Pancake, ActionType.Defense) =>
        // P1 pancake, P2 defend - both gain energy
        p1Energy += 1
        p2Energy += 0
        battleLog += "Player 1 uses pancake, Player 2 defends! Both gain energy."
        
      case (ActionType.Defense, ActionType.Pancake) =>
        // P1 defend, P2 pancake - both gain energy
        p1Energy += 0
        p2Energy += 1
        battleLog += "Player 2 uses pancake, Player 1 defends! Both gain energy."
    }
    
    // Ensure health doesn't go below 0 and energy doesn't exceed 100
    p1Health = math.max(0, p1Health)
    p2Health = math.max(0, p2Health)
    p1Energy = math.min(100, math.max(0, p1Energy))
    p2Energy = math.min(100, math.max(0, p2Energy))
    
    val updatedPlayer1Status = player1Status.copy(health = p1Health, energy = p1Energy)
    val updatedPlayer2Status = player2Status.copy(health = p2Health, energy = p2Energy)
    
    IO.pure((updatedPlayer1Status, updatedPlayer2Status, battleLog.mkString(" ")))
  }
  
  // Format battle result for display
  private def formatBattleResult(round: Int, player1Status: PlayerStatus, player2Status: PlayerStatus, battleLog: String): String = {
    val winner = if (player1Status.health <= 0 && player2Status.health <= 0) {
      "Draw - both players defeated!"
    } else if (player1Status.health <= 0) {
      "Player 2 wins!"
    } else if (player2Status.health <= 0) {
      "Player 1 wins!"
    } else {
      "Battle continues..."
    }
    
    s"""
Round ${round} Results:
${battleLog}

Player 1: Health=${player1Status.health}, Energy=${player1Status.energy}
Player 2: Health=${player2Status.health}, Energy=${player2Status.energy}

${winner}
""".trim
  }

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
      // Step 1.1 Skip user validation - already done in SubmitPlayerActionMessagePlanner via UserService
      _ <- IO(logger.info(s"跳过 playerID 验证 (已在上层通过 UserService 验证): playerID=${playerID}"))

      // Step 1.2 验证 roomID 是否存在，且房间状态未结束
      _ <- IO(logger.info(s"验证 roomID=${roomID} 是否存在 且状态允许记录行为"))
      roomQueryResult <- readDBJsonOptional(
        s"SELECT winner_id FROM ${schemaName}.battle_room_table WHERE room_id = ?",
        List(SqlParameter("String", roomID))
      )
      _ <- IO(logger.info(s"Room query result for roomID=${roomID}: ${roomQueryResult}"))
      roomExistsAndValid <- IO {
        roomQueryResult match {
          case Some(json) => 
            val winnerIdOpt = Option(decodeField[String](json, "winner_id")).filter(_.nonEmpty)
            val isValid = winnerIdOpt.isEmpty || winnerIdOpt.contains("")
            logger.info(s"Room found, winner_id=${winnerIdOpt}, isValid=${isValid}")
            isValid
          case None => 
            logger.info(s"Room not found in database for roomID=${roomID}")
            false
        }
      }
      _ <- if (!roomExistsAndValid) IO.raiseError(new IllegalArgumentException(s"Room does not exist or has ended: roomID=${roomID}")) else IO.unit
  
      // Step 1.3 检查 actionType 是否为有效值
      _ <- IO(logger.info(s"检查 actionType=${actionType} 是否有效"))
      _ <- IO {
        if (!List("代表Pancake动作", "代表防御动作", "代表喷射动作").contains(actionType)) 
          throw new IllegalArgumentException(s"Invalid action type: actionType=${actionType}")
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
          SqlParameter("String", targetID.getOrElse("")),
          SqlParameter("DateTime", currentTime.getMillis.toString)
        )
      )
  
      // Step 2.2 行为记录已成功存储
      _ <- IO(logger.info("行为记录已成功存储"))
      
    } yield {
      // Step 3.1 返回处理结果
      val resultMessage = "Individual action recorded successfully!"
      logger.info(resultMessage)
      resultMessage
    }
  }
}
