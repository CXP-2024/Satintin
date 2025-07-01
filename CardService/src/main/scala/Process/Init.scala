package Process

import Common.API.{API, PlanContext, TraceID}
import Common.DBAPI.{initSchema, writeDB, readDBRows}
import Common.ServiceUtils.schemaName
import Global.ServerConfig
import cats.effect.IO
import io.circe.generic.auto.*
import java.util.UUID
import org.joda.time.DateTime
import Global.DBConfig
import Process.ProcessUtils.server2DB
import Global.GlobalVariables
import Common.Object.SqlParameter
import cats.implicits.*
import io.circe._
import io.circe.syntax._

object Init {
  def init(config: ServerConfig): IO[Unit] = {
    given PlanContext = PlanContext(traceID = TraceID(UUID.randomUUID().toString), 0)
    given DBConfig = server2DB(config)

    val program: IO[Unit] = for {
      _ <- IO(GlobalVariables.isTest=config.isTest)
      _ <- API.init(config.maximumClientConnection)
      _ <- Common.DBAPI.SwitchDataSourceMessage(projectName = Global.ServiceCenter.projectName).send
      _ <- initSchema(schemaName)      /** 抽卡日志表，记录用户抽卡的相关信息
       * draw_id: 抽卡日志的唯一ID
       * user_id: 用户ID
       * card_list: 抽取到的卡牌ID数组
       * draw_time: 抽卡时间
       * total_stone_consumed: 消耗的原石数量
       * pool_type: 卡池类型（featured/standard）
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."card_draw_log_table" (
            draw_id VARCHAR NOT NULL PRIMARY KEY,
            user_id TEXT NOT NULL,
            card_list TEXT NOT NULL,
            draw_time TIMESTAMP NOT NULL,
            total_stone_consumed INT NOT NULL,
            pool_type TEXT
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
      )      /** 卡牌模板表，包含每张卡牌的基本信息
       * card_id: 卡牌的唯一ID
       * card_name: 卡牌名称
       * rarity: 卡牌稀有度（如普通、稀有、传说）
       * description: 卡牌技能描述
       * creation_time: 卡牌创建时间
       * type: 卡牌池类型（featured/standard/both）
       */
      _ <- writeDB(
        s"""
        CREATE TABLE IF NOT EXISTS "${schemaName}"."card_template_table" (
            card_id VARCHAR NOT NULL PRIMARY KEY,
            card_name TEXT NOT NULL,
            rarity TEXT NOT NULL,
            description TEXT,
            creation_time TIMESTAMP,
            type TEXT NOT NULL DEFAULT 'both'
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
        List()      )
      
      // Insert initial card templates if they don't exist
      _ <- IO(println("Inserting initial card templates..."))
      _ <- insertInitialCardTemplates()
    } yield ()

    program.handleErrorWith(err => IO {
      println("[Error] Process.Init.init 失败, 请检查 db-manager 是否启动及端口问题")
      err.printStackTrace()
    })
  }  // Function to insert initial card templates only if table is empty
  def insertInitialCardTemplates()(using PlanContext, DBConfig): IO[Unit] = {
    for {
      // Step 1: Check if card_template_table is empty
      _ <- IO(println("Checking if card_template_table is empty..."))
      countQuery <- IO(s"SELECT COUNT(*) as count FROM ${schemaName}.card_template_table")
      countResult <- readDBRows(countQuery, List())
      
      isEmpty <- IO {
        if (countResult.nonEmpty) {
          val json = countResult.head
          val cursor = json.hcursor
          val count = cursor.get[Int]("count").getOrElse(0)
          count == 0
        } else {
          true // If query fails, assume empty and insert
        }
      }
      
      _ <- if (isEmpty) {
        IO(println("Table is empty, inserting initial card templates...")) *>
        insertDefaultCardTemplates()
      } else {
        IO(println("Table already contains card templates, skipping insertion."))
      }
    } yield ()
  }  // Function to insert default card templates
  private def insertDefaultCardTemplates()(using PlanContext, DBConfig): IO[Unit] = {
    val initialTemplates = List(
      ("template-dragon-nai", "Dragon Nai", "传说", "反弹", "featured"),
      ("template-gaia", "盖亚", "传说", "穿透", "featured"),
      ("template-go", "Go", "传说", "发育", "featured"),
      ("template-jie", "杰哥", "传说", "穿透", "standard"),
      ("template-paimon", "Paimon", "稀有", "反弹", "both"),
      ("template-kun", "坤", "稀有", "穿透", "both"),
      ("template-man", "man", "稀有", "发育", "both"),
      ("template-ice", "冰", "普通", "反弹", "both"),
      ("template-wlm", "wlm", "普通", "发育", "both")
    )

    val insertTemplateQuery = s"""
      INSERT INTO ${schemaName}.card_template_table (card_id, card_name, rarity, description, creation_time, type)
      VALUES (?, ?, ?, ?, ?, ?);
    """

    for {
      _ <- initialTemplates.traverse { case (cardId, cardName, rarity, description, cardType) =>
        val params = List(
          SqlParameter("String", cardId),
          SqlParameter("String", cardName),
          SqlParameter("String", rarity),
          SqlParameter("String", description),
          SqlParameter("DateTime", DateTime.now.getMillis.toString),          SqlParameter("String", cardType)
        )
        writeDB(insertTemplateQuery, params)
      }
      _ <- IO(println(s"Successfully inserted ${initialTemplates.size} initial card templates"))
    } yield ()
  }
}
