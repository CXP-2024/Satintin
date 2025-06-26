
package Process

import Common.API.{API, PlanContext, TraceID}
import Common.DBAPI.{initSchema, writeDB}
import Common.ServiceUtils.schemaName
import Global.ServerConfig
import cats.effect.IO
import io.circe.generic.auto.*
import java.util.UUID
import Global.DBConfig
import Process.ProcessUtils.server2DB
import Global.GlobalVariables

object Init {
  def init(config: ServerConfig): IO[Unit] = {
    given PlanContext = PlanContext(traceID = TraceID(UUID.randomUUID().toString), 0)
    given DBConfig = server2DB(config)

    val program: IO[Unit] = for {
      _ <- IO(GlobalVariables.isTest=config.isTest)
      _ <- API.init(config.maximumClientConnection)
      _ <- Common.DBAPI.SwitchDataSourceMessage(projectName = Global.ServiceCenter.projectName).send
      _ <- initSchema(schemaName)
            /** 战斗状态表，记录战斗房间的实时状态信息
       * room_id: 房间的唯一ID
       * current_round: 当前回合数
       * round_phase: 当前回合阶段
       * remaining_time: 回合剩余时间，单位秒
       * player_one_status: JSON格式的玩家1状态，包含血量、能量、行动等信息
       * player_two_status: JSON格式的玩家2状态，包含血量、能量、行动等信息
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."battle_state_table" (
            room_id VARCHAR NOT NULL PRIMARY KEY,
            current_round INT NOT NULL DEFAULT 0,
            round_phase TEXT NOT NULL,
            remaining_time INT NOT NULL DEFAULT 0,
            player_one_status TEXT NOT NULL,
            player_two_status TEXT NOT NULL
        );
         
        """,
        List()
      )
      /** 战斗房间表，包含房间基本信息和状态追踪
       * room_id: 房间唯一ID
       * player_one_id: 玩家1的用户ID
       * player_two_id: 玩家2的用户ID
       * owner_id: 房主ID
       * current_turn_player: 当前行动玩家的ID
       * winner_id: 胜利玩家的ID
       * create_time: 房间创建时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."battle_room_table" (
            room_id VARCHAR NOT NULL PRIMARY KEY,
            player_one_id TEXT NOT NULL,
            player_two_id TEXT NOT NULL,
            owner_id TEXT NOT NULL,
            current_turn_player TEXT,
            winner_id TEXT,
            create_time TIMESTAMP NOT NULL
        );
         
        """,
        List()
      )
      /** 记录战斗行动相关信息，包括行动发起者、目标和时间等
       * action_id: 行动的唯一ID
       * room_id: 所属房间ID
       * player_id: 发起行动的玩家ID
       * action_type: 行动类型 (饼、防、撒)
       * target_id: (可选) 行动目标玩家的ID
       * action_time: 行动发生的时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."battle_action_table" (
            action_id VARCHAR NOT NULL PRIMARY KEY,
            room_id TEXT NOT NULL,
            player_id TEXT NOT NULL,
            action_type TEXT NOT NULL,
            target_id TEXT,
            action_time TIMESTAMP NOT NULL
        );
         
        """,
        List()
      )
    } yield ()

    program.handleErrorWith(err => IO {
      println("[Error] Process.Init.init 失败, 请检查 db-manager 是否启动及端口问题")
      err.printStackTrace()
    })
  }
}
    