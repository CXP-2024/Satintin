package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import Common.API.{PlanContext, Planner}
import Common.Object.SqlParameter
import cats.effect.IO
import io.circe.Json
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import cats.implicits.*
import APIs.UserService.ModifyUserStatusMessage  // 新增，用于发送用户状态修改消息

case object ReportManagementProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  
  def updateReportStatus(reportID: String, isResolved: Boolean)(using PlanContext): IO[String] = {
    // 检查输入参数有效性
    if (reportID.isEmpty) {
      return IO.raiseError(new IllegalArgumentException("非法的 reportID: 不能为空"))
    }

    for {
      _ <- IO(logger.info(s"开始查询举报记录: reportID=${reportID}"))

      // 查询举报记录
      optionalReport <- readDBJsonOptional(
        s"SELECT report_id, is_resolved FROM ${schemaName}.cheating_report_table WHERE report_id = ?",
        List(SqlParameter("String", reportID))
      )

      _ <- optionalReport match {
        case None =>
          val errMsg = s"未找到 reportID=${reportID} 的举报记录"
          IO(logger.error(errMsg)) >>
          IO.raiseError(new IllegalStateException(errMsg))

        case Some(json) =>
          val currentStatus = decodeField[Boolean](json, "is_resolved")
          IO(logger.info(s"报告查询成功: reportID=${reportID}, 当前状态=${currentStatus}"))
      }

      // 更新举报记录的处理状态
      updateResult <- {
        IO(logger.info(s"准备更新举报状态: reportID=${reportID}, isResolved=${isResolved}")) >>
        writeDB(
          s"UPDATE ${schemaName}.cheating_report_table SET is_resolved = ? WHERE report_id = ?",
          List(
            SqlParameter("Boolean", isResolved.toString),
            SqlParameter("String", reportID)
          )
        )
      }

      // 记录操作日志
      _ <- {
        val logID = java.util.UUID.randomUUID().toString
        val userID = "system" // 假设由系统更新，具体用户ID可替换
        val actionType = "更新举报状态"
        val actionDetail = s"更新举报记录 (reportID=${reportID}) 的处理状态为 ${isResolved}"
        val actionTime = DateTime.now().getMillis.toString
  
        IO(logger.info(s"准备记录操作日志: logID=${logID}, userID=${userID}, actionType=${actionType}, actionDetail=${actionDetail}, actionTime=${actionTime}")) >>
        writeDB(
          s"""
  INSERT INTO ${schemaName}.user_action_log_table (log_id, user_id, action_type, action_detail, action_time)
  VALUES (?, ?, ?, ?, ?)
  """.stripMargin,
          List(
            SqlParameter("String", logID),
            SqlParameter("String", userID),
            SqlParameter("String", actionType),
            SqlParameter("String", actionDetail),
            SqlParameter("DateTime", actionTime)
          )
        )
      }
  
      _ <- IO(logger.info(s"操作日志记录完成: reportID=${reportID}, actionType=更新举报状态"))

    } yield "举报状态已修改！"
  }
    
  def unbanUser(userID: String)(using PlanContext): IO[String] = {
    // 通过ModifyUserStatusMessage发送解封请求，UserService处理具体逻辑
    for {
      _ <- IO(logger.info(s"[ReportManagementProcess] 发送ModifyUserStatusMessage解除封禁, userID=${userID}"))
      result <- ModifyUserStatusMessage(userID, 0).send
      _ <- IO(logger.info(s"[ReportManagementProcess] 用户解封结果: ${result}"))
    } yield result
  }
  
  def banUser(userID: String, banDays: Int)(using PlanContext): IO[String] = {
    // 通过ModifyUserStatusMessage发送封禁请求，由UserService执行具体更新
    for {
      _ <- IO(logger.info(s"[ReportManagementProcess] 发送ModifyUserStatusMessage封禁 ${userID} ${banDays} 天"))
      result <- ModifyUserStatusMessage(userID, banDays).send
      _ <- IO(logger.info(s"[ReportManagementProcess] 用户封禁结果: ${result}"))
    } yield result
  }
}
