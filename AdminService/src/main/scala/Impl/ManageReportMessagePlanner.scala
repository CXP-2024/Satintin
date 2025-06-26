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
import Objects.AdminService.AdminAccount
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class ManageReportMessagePlanner(
    adminToken: String,
    reportID: String,
    resolutionStatus: String,
    override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate adminToken
      _ <- IO(logger.info(s"验证管理员Token: adminToken=${adminToken}"))
      adminAccount <- validateAdminToken(adminToken)

      // Step 2: Verify report existence
      _ <- IO(logger.info(s"根据reportID查询举报记录: reportID=${reportID}"))
      _ <- verifyReportExistence(reportID)

      // Step 3: Update report status
      _ <- IO(logger.info(s"更新举报记录状态: reportID=${reportID}, resolutionStatus=${resolutionStatus}"))
      updateResult <- updateReportStatus(reportID, resolutionStatus)

      _ <- IO(logger.info(s"举报记录状态更新成功: reportID=${reportID}, resolutionStatus=${resolutionStatus}, updateResult=${updateResult}"))

      // Step 4: Build and return result
    } yield "处理成功！"
  }

  /**
   * 验证管理员Token是否有效
   */
  private def validateAdminToken(adminToken: String)(using PlanContext): IO[AdminAccount] = {
    if (adminToken.isEmpty) {
      IO.raiseError(new IllegalArgumentException("adminToken不能为空"))
    } else {
      val sql =
        s"""
SELECT admin_id, account_name, password_hash, create_time
FROM ${schemaName}.admin_table
WHERE token = ? AND is_active = true
         """.stripMargin

      readDBJsonOptional(sql, List(SqlParameter("String", adminToken))).flatMap {
        case Some(json) => IO(decodeType[AdminAccount](json))
        case None =>
          val errorMessage = s"无效的adminToken：${adminToken}"
          logger.error(errorMessage)
          IO.raiseError(new IllegalStateException(errorMessage))
      }
    }
  }

  /**
   * 验证举报记录是否存在
   */
  private def verifyReportExistence(reportID: String)(using PlanContext): IO[Unit] = {
    if (reportID.isEmpty) {
      IO.raiseError(new IllegalArgumentException("reportID不能为空"))
    } else {
      val sql =
        s"""
SELECT report_id
FROM ${schemaName}.cheating_report_table
WHERE report_id = ?
         """.stripMargin
      readDBJsonOptional(sql, List(SqlParameter("String", reportID))).flatMap {
        case Some(_) => IO.unit
        case None =>
          val errorMessage = s"举报记录不存在：reportID=${reportID}"
          logger.error(errorMessage)
          IO.raiseError(new IllegalStateException(errorMessage))
      }
    }
  }
}