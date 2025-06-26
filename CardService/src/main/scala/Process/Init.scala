
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
            /** 抽卡日志表，记录用户抽卡的相关信息
       * draw_id: 抽卡日志的唯一ID
       * user_id: 用户ID
       * card_list: 抽取到的卡牌数组，包含卡牌ID及其稀有度
       * draw_time: 抽卡时间
       * total_stone_consumed: 消耗的原石数量
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."card_draw_log_table" (
            draw_id VARCHAR NOT NULL PRIMARY KEY,
            user_id TEXT NOT NULL,
            card_list TEXT NOT NULL,
            draw_time TIMESTAMP NOT NULL,
            total_stone_consumed INT NOT NULL
        );
         
        """,
        List()
      )
      /** 用户卡牌表，记录用户拥有的卡牌及其信息
       * user_card_id: 用户卡牌的唯一ID
       * user_id: 用户ID
       * card_id: 模板卡牌ID
       * rarity_level: 卡牌稀有度
       * card_level: 卡牌当前等级
       * acquisition_time: 卡牌获得时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."user_card_table" (
            user_card_id VARCHAR NOT NULL PRIMARY KEY,
            user_id TEXT NOT NULL,
            card_id TEXT NOT NULL,
            rarity_level TEXT NOT NULL,
            card_level INT NOT NULL,
            acquisition_time TIMESTAMP NOT NULL
        );
         
        """,
        List()
      )
      /** 卡牌模板表，包含每张卡牌的基本信息
       * card_id: 卡牌的唯一ID
       * card_name: 卡牌名称
       * rarity: 卡牌稀有度（如普通、稀有、传说）
       * description: 卡牌技能描述
       * creation_time: 卡牌创建时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."card_template_table" (
            card_id VARCHAR NOT NULL PRIMARY KEY,
            card_name TEXT NOT NULL,
            rarity TEXT NOT NULL,
            description TEXT,
            creation_time TIMESTAMP
        );
         
        """,
        List()
      )
      /** 用户战斗卡组表，记录用户卡组配置和卡牌信息
       * user_id: 用户ID，主键
       * card_ids: 战斗卡组，最多包含三张卡牌的ID列表
       * configuration_time: 卡组配置的时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."user_battle_deck_table" (
            user_id VARCHAR NOT NULL PRIMARY KEY,
            card_ids TEXT NOT NULL,
            configuration_time TIMESTAMP NOT NULL
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
    