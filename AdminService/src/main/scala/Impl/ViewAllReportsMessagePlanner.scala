package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Objects.AdminService.CheatingReport
import cats.effect.IO
import org.slf4j.LoggerFactory
import org.joda.time.DateTime
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Utils.AdminTokenValidationProcess

case class ViewAllReportsMessagePlanner(
  adminToken: String,
  override val planContext: PlanContext
) extends Planner[String] {  // 改为 String 返回类型

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: 验证管理员Token - 使用Utils
      _ <- IO(logger.info(s"验证管理员Token: adminToken=${adminToken}"))
      _ <- AdminTokenValidationProcess.validateAdminToken(adminToken)

      // Step 2: 查询所有举报记录
      _ <- IO(logger.info("开始查询所有举报记录"))
      reports <- getAllReports()

      // Step 3: 序列化为 JSON 字符串
      result <- IO(reports.asJson.toString)
      _ <- IO(logger.info(s"查询完成，共找到 ${reports.length} 条举报记录"))
    } yield result
  }

  /**
   * 查询所有举报记录
   */
  private def getAllReports()(using PlanContext): IO[List[CheatingReport]] = {
    val sql = 
      s"""
        SELECT 
          report_id,
          reporting_user_id,
          reported_user_id,
          report_reason,
          is_resolved,
          report_time
        FROM ${schemaName}.cheating_report_table
        ORDER BY report_time DESC
      """

    for {
      rows <- readDBRows(sql, List())
      reports <- IO {
        rows.map { json =>
          CheatingReport(
            reportID = decodeField[String](json, "report_id"),
            reportingUserID = decodeField[String](json, "reporting_user_id"),
            reportedUserID = decodeField[String](json, "reported_user_id"),
            reportReason = decodeField[String](json, "report_reason"),
            isResolved = decodeField[Boolean](json, "is_resolved"),
            reportTime = decodeField[DateTime](json, "report_time")
          )
        }
      }
      _ <- IO(logger.info(s"成功解析 ${reports.length} 条举报记录"))
    } yield reports
  }
}