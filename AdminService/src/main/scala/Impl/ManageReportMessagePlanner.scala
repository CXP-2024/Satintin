package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Objects.AdminService.AdminAccount
import Utils.ReportManagementProcess.updateReportStatus
import cats.effect.IO
import org.slf4j.LoggerFactory
import org.joda.time.DateTime
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Utils.AdminTokenValidationProcess

case class ManageReportMessagePlanner(
  adminToken: String,
  reportID: String,
  isResolved: Boolean,
  override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"开始管理举报记录: reportID=${reportID}, isResolved=${isResolved}"))

      // Step 1: 验证管理员Token - 使用Utils
      adminAccount <- AdminTokenValidationProcess.validateAdminToken(adminToken)

      // Step 2: 更新举报记录状态
      _ <- IO(logger.info(s"更新举报记录状态: reportID=${reportID}, isResolved=${isResolved}"))
      _ <- updateReportStatus(reportID, isResolved)

      _ <- IO(logger.info(s"举报记录状态更新成功: reportID=${reportID}, isResolved=${isResolved}"))
    } yield s"举报记录状态已更新为: ${if (isResolved) "已处理" else "未处理"}"
  }

  private def updateReportStatus(reportID: String, isResolved: Boolean)(using PlanContext): IO[Unit] = {
    val sql = 
      s"""
        UPDATE ${schemaName}.cheating_report_table 
        SET is_resolved = ?
        WHERE report_id = ?
      """
    
    val params = List(
      SqlParameter("Boolean", isResolved.toString),
      SqlParameter("String", reportID)
    )

    for {
      _ <- writeDB(sql, params)
      _ <- IO(logger.info(s"更新举报状态完成: reportID=${reportID}, isResolved=${isResolved}"))
    } yield ()
  }
}