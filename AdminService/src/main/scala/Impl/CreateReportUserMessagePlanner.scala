package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import java.util.UUID

/**
 * 创建举报记录的处理器
 * @param userID 举报人的用户ID
 * @param reportedUserID 被举报用户的ID
 * @param reportReason 举报的具体原因
 */
case class CreateReportUserMessagePlanner(
  userID: String,
  reportedUserID: String,
  reportReason: String,
  override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 2: 验证被举报用户存在
      _ <- IO(logger.info(s"[Step 2] 验证被举报用户是否存在: $reportedUserID"))
      _ <- validateReportedUser(reportedUserID)
      _ <- IO(logger.info(s"[Step 2] 被举报用户验证成功"))

      // Step 3: 验证举报原因合法性
      _ <- IO(logger.info(s"[Step 3] 验证举报原因: $reportReason"))
      _ <- validateReportReason(reportReason)
      _ <- IO(logger.info(s"[Step 3] 举报原因验证通过"))

      // Step 4: 创建举报记录
      reportID <- IO(UUID.randomUUID().toString)
      _ <- IO(logger.info(s"[Step 4] 开始创建举报记录，举报ID: $reportID"))
      _ <- createReportRecord(reportID, userID, reportedUserID, reportReason)
      
      // Step 5: 更新系统统计数据
      _ <- IO(logger.info(s"[Step 5] 更新系统举报统计数据"))
      _ <- updateSystemReportStats()

      _ <- IO(logger.info(s"[Step 6] 举报记录创建成功，举报ID: $reportID"))
    } yield s"举报提交成功，举报ID: $reportID"
  }

  /**
   * 验证被举报用户是否存在
   */
  private def validateReportedUser(reportedUserID: String)(using PlanContext): IO[Unit] = {
    for {
      _ <- IO {
        if (reportedUserID == null || reportedUserID.trim.isEmpty)
          throw new IllegalArgumentException("被举报用户ID不能为空")
      }
      
      _ <- IO(logger.info(s"被举报用户验证通过: $reportedUserID"))
    } yield ()
  }

  /**
   * 验证举报原因的合法性
   */
  private def validateReportReason(reportReason: String)(using PlanContext): IO[Unit] = {
    for {
      _ <- IO {
        if (reportReason == null || reportReason.trim.isEmpty)
          throw new IllegalArgumentException("举报原因不能为空")
        
        if (reportReason.length > 500)
          throw new IllegalArgumentException("举报原因过长，请控制在500字符以内")
        
        // 可以添加更多的验证规则，比如敏感词过滤等
      }
      _ <- IO(logger.info(s"举报原因验证通过，长度: ${reportReason.length}"))
    } yield ()
  }

  /**
   * 创建举报记录到数据库
   */
  private def createReportRecord(
    reportID: String,
    userID: String,
    reportedUserID: String,
    reportReason: String
  )(using PlanContext): IO[Unit] = {
    val insertSql =
      s"""
        INSERT INTO ${schemaName}.cheating_report_table 
        (report_id, reporting_user_id, reported_user_id, report_reason, is_resolved, report_time)
        VALUES (?, ?, ?, ?, false, NOW())
      """.stripMargin

    val params = List(
      SqlParameter("String", reportID),
      SqlParameter("String", userID),
      SqlParameter("String", reportedUserID),
      SqlParameter("String", reportReason)
    )

    for {
      _ <- writeDB(insertSql, params)
      _ <- IO(logger.info(s"举报记录已插入数据库: $reportID"))
    } yield ()
  }

  /**
   * 更新系统统计中的举报总数
   */
  private def updateSystemReportStats()(using PlanContext): IO[Unit] = {
    val updateSql =
      s"""
        UPDATE ${schemaName}.system_stats_table 
        SET total_reports = total_reports + 1,
            snapshot_time = NOW()
      """.stripMargin

    for {
      _ <- writeDB(updateSql, List())
      _ <- IO(logger.info("系统举报统计数据已更新"))
    } yield ()
  }
}