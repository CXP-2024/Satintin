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
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.API.PlanContext
import Common.API.{PlanContext}

case object ReportManagementProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  
  def updateReportStatus(reportID: String, resolutionStatus: String)(using PlanContext): IO[String] = {
    // 定义合法状态集合
    val validStatuses = Set("已处理", "未处理")
  
    // 检查输入参数有效性
    if (reportID.isEmpty) {
      return IO.raiseError(new IllegalArgumentException("非法的 reportID: 不能为空"))
    }
    if (!validStatuses.contains(resolutionStatus)) {
      return IO.raiseError(new IllegalArgumentException(s"非法的 resolutionStatus: '${resolutionStatus}'，有效状态为: ${validStatuses.mkString(", ")}"))
    }
  
    // 获取日志器
  // val logger = LoggerFactory.getLogger("updateReportStatus")  // 同文后端处理: logger 统一
  
    for {
      _ <- IO(logger.info(s"开始查询举报记录: reportID=${reportID}"))
  
      // 查询举报记录
      optionalReport <- readDBJsonOptional(
        s"SELECT report_id, resolution_status FROM ${schemaName}.cheating_report_table WHERE report_id = ?",
        List(SqlParameter("String", reportID))
      )
  
      _ <- optionalReport match {
        case None =>
          val errMsg = s"未找到 reportID=${reportID} 的举报记录"
          IO(logger.error(errMsg)) >>
          IO.raiseError(new IllegalStateException(errMsg))
  
        case Some(json) =>
          val currentStatus = decodeField[String](json, "resolution_status")
          IO(logger.info(s"报告查询成功: reportID=${reportID}, 当前状态=${currentStatus}"))
      }
  
      // 更新举报记录的处理状态
      updateResult <- {
        IO(logger.info(s"准备更新举报状态: reportID=${reportID}, resolutionStatus=${resolutionStatus}")) >>
        writeDB(
          s"UPDATE ${schemaName}.cheating_report_table SET resolution_status = ?, is_resolved = ? WHERE report_id = ?",
          List(
            SqlParameter("String", resolutionStatus),
            SqlParameter("Boolean", (resolutionStatus == "已处理").toString),
            SqlParameter("String", reportID)
          )
        )
      }
  
      _ <- IO(logger.info(s"举报状态更新成功: reportID=${reportID}, resolutionStatus=${resolutionStatus}, 数据库结果=${updateResult}"))
  
      // 记录操作日志
      _ <- {
        val logID = java.util.UUID.randomUUID().toString
        val userID = "system" // 假设由系统更新，具体用户ID可替换
        val actionType = "更新举报状态"
        val actionDetail = s"更新举报记录 (reportID=${reportID}) 的处理状态为 ${resolutionStatus}"
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
    for {
      // Step 1.1: Validate input parameter
      _ <- IO {
        if (userID.isEmpty) {
          throw new IllegalArgumentException("用户ID不能为空")
        }
      }
      _ <- IO(logger.info(s"[unbanUser] 开始处理用户解封请求，用户ID: ${userID}"))
  
      // Step 2: Update banDays field
      updateSql <- IO {
        s"""
          UPDATE ${schemaName}.user_table
          SET ban_days = 0
          WHERE user_id = ?
        """
      }
      updateParams <- IO {
        List(SqlParameter("String", userID))
      }
      _ <- IO(logger.info(s"[unbanUser] 准备更新用户封禁状态为解封, SQL: ${updateSql}"))
      updateResult <- writeDB(updateSql, updateParams)
      _ <- IO(logger.info(s"[unbanUser] 用户封禁状态更新完毕，数据库操作返回: ${updateResult}"))
  
      // Step 3.1: Log the unban action in UserActionLogTable
      logSql <- IO {
        s"""
          INSERT INTO ${schemaName}.user_action_log_table (log_id, user_id, action_type, action_detail, action_time)
          VALUES (?, ?, ?, ?, ?)
        """
      }
      logId <- IO {
        java.util.UUID.randomUUID().toString
      }
      actionType <- IO {
        "UNBAN"
      }
      actionDetail <- IO {
        s"用户 [${userID}] 解封"
      }
      actionTime <- IO {
        DateTime.now()
      }
      logParams <- IO {
        List(
          SqlParameter("String", logId),
          SqlParameter("String", userID),
          SqlParameter("String", actionType),
          SqlParameter("String", actionDetail),
          SqlParameter("DateTime", actionTime.getMillis.toString)
        )
      }
      _ <- IO(logger.info(s"[unbanUser] 正在将解封操作记录写入日志表，日志ID: ${logId}"))
      logResult <- writeDB(logSql, logParams)
      _ <- IO(logger.info(s"[unbanUser] 解封操作记录成功写入日志，数据库操作返回: ${logResult}"))
  
      // Step 4.1: Return success message
      successMessage <- IO {
        "用户已解封!"
      }
      _ <- IO(logger.info(s"[unbanUser] 返回结果: ${successMessage}"))
    } yield successMessage
  }
  
  
  def banUser(userID: String, banDays: Int)(using PlanContext): IO[String] = {
    for {
      // Step 1: 验证输入参数合法性
      _ <- IO {
        if (userID.trim.isEmpty)
          throw new IllegalArgumentException("用户ID不能为空")
        if (banDays < 0)
          throw new IllegalArgumentException("封禁天数不能是负数")
      }
  
      // Step 2: 查询用户记录是否存在
      _ <- IO(logger.info(s"Step 2: 检查用户记录是否存在, userID=${userID}"))
      userCheckSql <- IO { s"SELECT 1 FROM ${schemaName}.users WHERE user_id = ?" }
      userExists <- readDBBoolean(userCheckSql, List(SqlParameter("String", userID)))
      _ <- IO {
        if (!userExists)
          throw new IllegalStateException(s"用户ID[${userID}]不存在")
      }
  
      // Step 3: 更新用户的封禁状态
      _ <- IO(logger.info(s"Step 3: 更新用户 ${userID} 的封禁状态为 ${banDays} 天"))
      updateSql <- IO { s"UPDATE ${schemaName}.users SET ban_days = ? WHERE user_id = ?" }
      updateParams <- IO {
        List(
          SqlParameter("Int", banDays.toString),
          SqlParameter("String", userID)
        )
      }
      _ <- writeDB(updateSql, updateParams)
  
      // Step 4: 操作成功
      _ <- IO(logger.info(s"用户ID[${userID}]已成功封禁 ${banDays} 天"))
    } yield "用户已封禁!"
  }
}
