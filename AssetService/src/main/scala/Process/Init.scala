
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
      /** 用户资产状态表，记录用户的原石数量、抽卡次数以及最近更新时间
       * user_id: 用户的唯一ID
       * stone_amount: 当前用户的原石数量
       * card_draw_count: 用户抽卡次数
       * last_updated: 最近更新时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."user_asset_status_table" (
            user_id VARCHAR NOT NULL PRIMARY KEY,
            stone_amount INT NOT NULL,
            card_draw_count INT NOT NULL DEFAULT 0,
            last_updated TIMESTAMP NOT NULL
        );
         
        """,
        List()
      )
      /** 资产交易表，记录用户资产变动相关交易信息
       * transaction_id: 交易的唯一ID
       * user_id: 用户ID
       * transaction_type: 交易类型 (如CHARGE、PURCHASE、REWARD)
       * change_amount: 资产变动数量
       * change_reason: 变动原因
       * timestamp: 交易时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."asset_transaction_table" (
            transaction_id VARCHAR NOT NULL PRIMARY KEY,
            user_id TEXT NOT NULL,
            transaction_type TEXT NOT NULL,
            change_amount INT NOT NULL DEFAULT 0,
            change_reason TEXT,
            timestamp TIMESTAMP NOT NULL
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
    