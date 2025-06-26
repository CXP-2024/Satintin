
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
            /** 管理员账号表，包含管理员的基本信息
       * admin_id: 管理员的唯一ID，主键，自动递增
       * account_name: 管理员账号名
       * password_hash: 管理员密码哈希值
       * create_time: 管理员账号创建时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."admin_account_table" (
            admin_id VARCHAR NOT NULL PRIMARY KEY,
            account_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            create_time TIMESTAMP NOT NULL
        );
         
        """,
        List()
      )
      /** 系统统计表，包含系统整体的统计数据
       * stats_id: 统计数据的唯一标识符
       * active_user_count: 当前活跃用户数
       * total_matches: 系统总对战次数
       * total_card_draws: 系统总抽卡次数
       * total_reports: 系统收到的举报总数
       * snapshot_time: 统计数据的时间点
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."system_stats_table" (
            stats_id VARCHAR NOT NULL PRIMARY KEY,
            active_user_count INT NOT NULL DEFAULT 0,
            total_matches INT NOT NULL DEFAULT 0,
            total_card_draws INT NOT NULL DEFAULT 0,
            total_reports INT NOT NULL DEFAULT 0,
            snapshot_time TIMESTAMP NOT NULL
        );
         
        """,
        List()
      )
      /** 用户行为日志表，记录用户行为的详细信息及时间
       * log_id: 日志的唯一ID
       * user_id: 用户的唯一ID
       * action_type: 用户行为的类型，例如对战、抽卡等
       * action_detail: 用户行为的详细信息
       * action_time: 用户行为发生的时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."user_action_log_table" (
            log_id VARCHAR NOT NULL PRIMARY KEY,
            user_id TEXT NOT NULL,
            action_type TEXT NOT NULL,
            action_detail TEXT NOT NULL,
            action_time TIMESTAMP NOT NULL
        );
         
        """,
        List()
      )
      /** 举报表，存储用户举报的信息及其处理状态
       * report_id: 举报的唯一ID
       * reporting_user_id: 举报人ID
       * reported_user_id: 被举报的用户ID
       * report_reason: 举报的原因
       * is_resolved: 举报是否已处理
       * report_time: 举报时间
       * resolution_status: 举报处理状态
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."cheating_report_table" (
            report_id VARCHAR NOT NULL PRIMARY KEY,
            reporting_user_id TEXT NOT NULL,
            reported_user_id TEXT NOT NULL,
            report_reason TEXT NOT NULL,
            is_resolved BOOLEAN DEFAULT false,
            report_time TIMESTAMP NOT NULL,
            resolution_status TEXT DEFAULT '未处理'
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
    