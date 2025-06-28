
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
            /** 借书记录表，记录用户的借书信息
       * record_id: 借书记录的唯一ID
       * user_id: 用户的ID
       * book_id: 借阅的图书ID
       * borrowed_at: 借书的时间
       * due_at: 应还书的时间
       * returned_at: 归还书籍的时间，可以为空
       * renewal_count: 续借次数
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."borrow_record_table" (
            record_id VARCHAR NOT NULL PRIMARY KEY,
            user_id TEXT NOT NULL,
            book_id TEXT NOT NULL,
            borrowed_at TIMESTAMP NOT NULL,
            due_at TIMESTAMP NOT NULL,
            returned_at TIMESTAMP,
            renewal_count INT NOT NULL DEFAULT 0
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
    