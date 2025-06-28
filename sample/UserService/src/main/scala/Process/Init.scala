
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
            /** 用户密码表，存储用户的密码哈希值和盐值信息
       * user_id: 用户的唯一ID，与UserTable相关联
       * password_hash: 密码的哈希值
       * salt: 密码对应的盐值
       * created_at: 密码记录生成时间
       * updated_at: 密码记录更新时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."user_password_table" (
            user_id VARCHAR NOT NULL PRIMARY KEY,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        );
         
        """,
        List()
      )
      /** 用户表，包含用户的基本信息和角色信息
       * user_id: 用户的唯一ID，主键，自动递增
       * name: 用户名称
       * id_card: 用户身份证
       * phone_number: 用户手机号
       * role: 用户角色（管理员/普通用户）
       * created_at: 创建时间
       * updated_at: 更新时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."user_table" (
            user_id VARCHAR NOT NULL PRIMARY KEY,
            name TEXT NOT NULL,
            id_card TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        );
         
        """,
        List()
      )
      /** 登录Token表，用于存储用户登录相关的Token信息
       * token: 登录Token，作为主键
       * user_id: 用户ID
       * issued_at: Token生成时间
       * expires_at: Token过期时间
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."login_token_table" (
            token VARCHAR NOT NULL PRIMARY KEY,
            user_id TEXT NOT NULL,
            issued_at TIMESTAMP NOT NULL,
            expires_at TIMESTAMP NOT NULL
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
    