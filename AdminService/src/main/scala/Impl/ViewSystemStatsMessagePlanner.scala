package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Objects.AdminService.SystemStats
import cats.effect.IO
import org.slf4j.LoggerFactory
import org.joda.time.DateTime
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
import Common.DBAPI._
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.ServiceUtils.schemaName
import Objects.AdminService.SystemStats
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Utils.AdminTokenValidationProcess

// case class ViewSystemStatsMessage(adminToken: String) extends API[SystemStats](serviceCode = "ViewSystemStats")

case class ViewSystemStatsMessagePlanner(
    adminToken: String,
    override val planContext: PlanContext
) extends Planner[SystemStats] {
  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[SystemStats] = {
    for {
      // Step 1: 验证管理员Token - 使用Utils
      _ <- IO(logger.info(s"开始验证管理员令牌 adminToken=${adminToken}"))
      _ <- AdminTokenValidationProcess.validateAdminToken(adminToken)

      // Step 2: Query system stats
      _ <- IO(logger.info("从数据库查询最新的系统统计记录"))
      systemStats <- queryLatestSystemStats()
    } yield systemStats
  }
  /** Step 2: 查询最新的系统统计数据 */
  private def queryLatestSystemStats()(using PlanContext): IO[SystemStats] = {
    val sql =
      s"""
         |SELECT 
         |  active_user_count,
         |  total_matches,
         |  total_card_draws,
         |  total_reports,
         |  snapshot_time
         |FROM ${schemaName}.system_stats_table
         |ORDER BY snapshot_time DESC
         |LIMIT 1;
         |""".stripMargin

    readDBJsonOptional(sql, List.empty[SqlParameter]).flatMap {
      case Some(json) =>
        IO {
          logger.info("成功获取最新的系统统计记录")
          SystemStats(
            activeUserCount = decodeField[Int](json, "active_user_count"),
            totalMatches = decodeField[Int](json, "total_matches"),
            totalCardDraws = decodeField[Int](json, "total_card_draws"),
            totalReports = decodeField[Int](json, "total_reports"),
            snapshotTime = decodeField[DateTime](json, "snapshot_time")
          )
        }

      case None =>
        val errorMsg = "未找到任何系统统计记录"
        logger.error(errorMsg)
        IO.raiseError(new IllegalStateException(errorMsg))
    }
  }
}