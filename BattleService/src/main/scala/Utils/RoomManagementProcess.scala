package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import cats.implicits.*
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Objects.UserService.MessageEntry
import Objects.UserService.User
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import Common.API.PlanContext
import Common.Object.ParameterList
import Common.API.{PlanContext}
import Common.Object.{ParameterList, SqlParameter}
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Utils.PlayerActionProcess.initializeBattleState

case object RoomManagementProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  def createBattleRoom(playerOneID: String)(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger("createBattleRoom")  // 同文后端处理: logger 统一
  
    if (playerOneID.isEmpty) {
      IO.raiseError(new IllegalArgumentException("playerOneID不能为空"))
    } else {
      for {
        // Step 1: Log the playerOneID (user validation is done in the planner)
        _ <- IO(logger.info(s"开始创建房间，房主ID: ${playerOneID}"))
  
        // Step 2: Generate a unique roomID
        roomID <- IO(java.util.UUID.randomUUID().toString)
        _ <- IO(logger.info(s"生成的房间ID: ${roomID}"))
  
        // Step 3: Insert a new record into the battle_room_table
        currentTime <- IO(DateTime.now())
        _ <- {
          val sqlInsert = s"""
            INSERT INTO ${schemaName}.battle_room_table 
            (room_id, player_one_id, player_two_id, owner_id, current_turn_player, winner_id, create_time) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          """
          val params = List(
            SqlParameter("String", roomID),
            SqlParameter("String", playerOneID),
            SqlParameter("String", ""),                // player_two_id left empty
            SqlParameter("String", playerOneID),       // playerOne is the room owner
            SqlParameter("String", ""),                // current_turn_player left empty
            SqlParameter("String", ""),                // winner_id left empty
            SqlParameter("DateTime", currentTime.getMillis.toString) // Creation time as DateTime
          )
          writeDB(sqlInsert, params)
        }
        _ <- IO(logger.info(s"对战房间记录创建成功，房间ID: ${roomID}"))
  
        // Step 4: Return the generated roomID
      } yield roomID
    }
  }
  
  
  def removePlayerFromRoom(roomID: String, playerID: String)(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger("removePlayerFromRoom")  // 同文后端处理: logger 统一
    logger.info(s"开始从房间中移除玩家，roomID: ${roomID}, playerID: ${playerID}")
    
    // 查询房间信息
    val selectRoomSQL =
      s"""
         SELECT room_id, player_one_id, player_two_id
         FROM ${schemaName}.battle_room_table
         WHERE room_id = ?;
       """
    val selectRoomParams = List(SqlParameter("String", roomID))
    
    (for {
      roomOpt <- readDBJsonOptional(selectRoomSQL, selectRoomParams)
      result <- roomOpt match {
        case None =>
          IO {
            logger.error(s"房间ID ${roomID} 不存在")
            "房间不存在!"
          }
        case Some(roomJson) =>
          val playerOneID = decodeField[String](roomJson, "player_one_id")
          val playerTwoID = decodeField[String](roomJson, "player_two_id")
          
          if (playerID != playerOneID && playerID != playerTwoID) {
            IO {
              logger.error(s"玩家ID ${playerID} 不在房间 ${roomID} 中")
              "玩家不属于该房间!"
            }
          } else {
            // 确定要更新为null的字段
            val updateField = if (playerID == playerOneID) "player_one_id" else "player_two_id"
            val clearPlayerSQL =
              s"""
                 UPDATE ${schemaName}.battle_room_table
                 SET ${updateField} = NULL
                 WHERE room_id = ?;
               """
            val clearPlayerParams = List(SqlParameter("String", roomID))
            
            for {
              _ <- writeDB(clearPlayerSQL, clearPlayerParams)
              _ <- IO(logger.info(s"成功将玩家 ${playerID} 从房间 ${roomID} 中移除"))
  
              // 检查房间是否为空并更新状态
              isRoomEmpty <- IO((playerID == playerOneID && playerTwoID.isEmpty) || (playerID == playerTwoID && playerOneID.isEmpty))
              _ <- if (isRoomEmpty) {
                val closeRoomSQL =
                  s"""
                     DELETE FROM ${schemaName}.battle_room_table
                     WHERE room_id = ?;
                   """
                val closeRoomParams = List(SqlParameter("String", roomID))
                writeDB(closeRoomSQL, closeRoomParams) *> IO(logger.info(s"房间 ${roomID} 已清空并删除"))
              } else IO.unit
  
              // 记录玩家退出行为
              actionID <- IO(java.util.UUID.randomUUID().toString)
              currentTime <- IO(DateTime.now())
              insertActionSQL =
                s"""
                   INSERT INTO ${schemaName}.battle_action_table (action_id, room_id, player_id, action_type, action_time)
                   VALUES (?, ?, ?, ?, ?);
                 """
              insertActionParams = List(
                SqlParameter("String", actionID),
                SqlParameter("String", roomID),
                SqlParameter("String", playerID),
                SqlParameter("String", "移除玩家"),
                SqlParameter("DateTime", currentTime.getMillis.toString)
              )
              _ <- writeDB(insertActionSQL, insertActionParams) *> IO(logger.info(s"记录玩家 ${playerID} 退出房间 ${roomID} 的行为，记录ID ${actionID}"))
            } yield "玩家已退出房间!"
          }
      }
    } yield result).handleErrorWith { e =>
      IO {
        logger.error(s"从房间中移除玩家时出现错误: ${e.getMessage}", e)
        "操作失败，请稍后重试!"
      }
    }
  }
  
  
  def addPlayerToRoom(roomID: String, playerTwoID: String)(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger(getClass)  // 同文后端处理: logger 统一
  
    logger.info(s"开始执行addPlayerToRoom，参数: roomID=${roomID}, playerTwoID=${playerTwoID}")
  
    val validateRoomSQL =
      s"""
         SELECT room_id, player_one_id, player_two_id
         FROM ${schemaName}.battle_room_table
         WHERE room_id = ?
      """
    val updateRoomSQL =
      s"""
         UPDATE ${schemaName}.battle_room_table
         SET player_two_id = ?, current_turn_player = player_one_id
         WHERE room_id = ?
      """
    
    for {
      // Step 1: 验证 roomID 是否存在且状态允许添加玩家
      _ <- IO(logger.info("[Step 1] 验证 roomID 是否存在且状态允许添加玩家"))
      roomDataOpt <- readDBJsonOptional(validateRoomSQL, List(SqlParameter("String", roomID)))
  
      roomData <- roomDataOpt match {
        case Some(data) => IO.pure(data)
        case None       => IO.raiseError(new IllegalArgumentException(s"房间ID ${roomID} 不存在"))
      }
  
      playerOneID <- IO { decodeField[String](roomData, "player_one_id") }
      currentTwoID <- IO { decodeField[String](roomData, "player_two_id") }
  
      _ <- IO {
        if (currentTwoID.nonEmpty) {
          throw new IllegalStateException(s"房间ID ${roomID} 已有第二玩家")
        }
        if (playerOneID == playerTwoID) {
          throw new IllegalArgumentException(s"玩家ID重复: playerTwoID=${playerTwoID} 和 playerOneID=${playerOneID}")
        }
      }      // Step 2: 验证通过，准备更新数据库
      _ <- IO(logger.info(s"[Step 2] 验证通过，准备将 playerTwoID=${playerTwoID} 添加到房间 roomID=${roomID}"))
      updateResult <- writeDB(updateRoomSQL, List(SqlParameter("String", playerTwoID), SqlParameter("String", roomID)))

      _ <- IO {
        if (updateResult != "Operation(s) done successfully") {
          throw new IllegalStateException(s"[Step 3] 数据库更新失败: result=${updateResult}")
        }
      }

      // Step 3: Initialize battle state now that both players are in the room
      _ <- IO(logger.info(s"[Step 3] 初始化战斗状态，房间: ${roomID}, 玩家1: ${playerOneID}, 玩家2: ${playerTwoID}"))
      _ <- initializeBattleState(roomID, playerOneID, playerTwoID)

      // Step 4: 全部完成，准备返回成功结果
      _ <- IO(logger.info(s"[Step 4] 数据库更新成功，返回操作结果"))
    } yield "玩家加入成功!"
  }
}
