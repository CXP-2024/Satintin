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
            /** 用户资产表，记录用户的资产相关信息
       * user_id: 用户的唯一ID
       * stone_amount: 当前原石数量
       * card_draw_count: 抽卡次数
       * rank: 段位名称
       * rank_position: 段位排名
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."user_asset_table" (
            user_id VARCHAR NOT NULL PRIMARY KEY,
            stone_amount INT NOT NULL DEFAULT 0,
            card_draw_count INT NOT NULL DEFAULT 0,
            rank TEXT,
            rank_position INT DEFAULT 0
        );
         
        """,
        List()
      )
      /** 用户数据表，存储用户的基本信息
       * user_id: 用户的唯一标识
       * username: 用户名
       * password_hash: 用户密码的哈希值
       * email: 用户邮箱
       * phone_number: 用户的手机号
       * register_time: 用户注册时间
       * permission_level: 用户权限等级 (管理员/普通用户)
       * ban_days: 封禁天数
       * is_online: 用户是否在线
       * match_status: 用户当前的对战状态
       * usertoken: 用户登录令牌
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."user_table" (
            user_id VARCHAR NOT NULL PRIMARY KEY,
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT NOT NULL,
            phone_number TEXT,
            register_time TIMESTAMP NOT NULL,
            permission_level INT NOT NULL,
            ban_days INT NOT NULL DEFAULT 0,
            is_online BOOLEAN NOT NULL DEFAULT false,
            match_status TEXT,
            usertoken TEXT
        );
         
        """,
        List()
      )
      /** 用户操作日志表，记录用户的操作记录
       * log_id: 操作日志的唯一ID
       * user_id: 操作的用户ID
       * action_type: 操作的类型 (如修改信息、登录登出)
       * action_detail: 操作详情
       * action_time: 操作时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."user_operation_log_table" (
            log_id VARCHAR NOT NULL PRIMARY KEY,
            user_id TEXT NOT NULL,
            action_type TEXT NOT NULL,
            action_detail TEXT NOT NULL,
            action_time TIMESTAMP NOT NULL
        );
         
        """,
        List()
      )
      /** 用户社交关系表，包含好友列表、黑名单和消息盒子信息
       * user_id: 用户的唯一ID
       * friend_list: 好友列表，包含好友user_id数组
       * black_list: 黑名单，包含被拉黑的user_id数组
       * message_box: 消息列表（消息来源、内容及时间）
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."user_social_table" (
            user_id VARCHAR NOT NULL PRIMARY KEY,
            friend_list TEXT NOT NULL,
            black_list TEXT NOT NULL,
            message_box TEXT NOT NULL
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
