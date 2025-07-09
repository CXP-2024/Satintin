package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe.Json
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import org.joda.time.DateTime
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*

case class ModifyUserStatusMessagePlanner(
    userID: String,
    banDays: Int,
    override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // 更新用户封禁状态
      _ <- IO(logger.info(s"调用 updateBanStatus 更新用户 ${userID} 的封禁天数为 ${banDays}"))
      updateResult <- updateBanStatus(userID, banDays)
      _ <- IO(logger.info(s"updateBanStatus 更新结果: ${updateResult}"))

    } yield "用户状态修改成功！"
  }
  
  def updateBanStatus(userID: String, banDays: Int)(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate inputs
      _ <- IO {
        if (userID.trim.isEmpty) {
          logger.error("userID不能为空")
          throw new IllegalArgumentException("userID不能为空")
        }
        if (banDays < 0) {
          logger.error(s"banDays不能为负数: ${banDays}")
          throw new IllegalArgumentException("banDays不能为负数")
        }
      }
  
      // Step 2: Update ban_days in user_table
      updateSQL <- IO {
        s"""
  UPDATE ${schemaName}.user_table
  SET ban_days = ?
  WHERE user_id = ?
         """.stripMargin
      }
      updateParams <- IO {
        List(
          SqlParameter("Int", banDays.toString),
          SqlParameter("String", userID)
        )
      }
      _ <- IO(logger.info(s"封禁状态更新 SQL: ${updateSQL}, 参数: userID=${userID}, banDays=${banDays}"))
      updateResult <- writeDB(updateSQL, updateParams)
      _ <- IO(logger.info(s"封禁状态更新完成: ${updateResult}"))
  
      // Step 3: Insert operation log into user_operation_log_table
      logID <- IO(java.util.UUID.randomUUID().toString)
      actionType <- IO("更新封禁状态")
      actionDetail <- IO(s"将用户 ${userID} 的封禁天数更新为 ${banDays}")
      actionTime <- IO(DateTime.now())
  
      insertLogSQL <- IO {
        s"""
  INSERT INTO ${schemaName}.user_operation_log_table
  (log_id, user_id, action_type, action_detail, action_time)
  VALUES (?, ?, ?, ?, ?)
         """.stripMargin
      }
      insertLogParams <- IO {
        List(
          SqlParameter("String", logID),
          SqlParameter("String", userID),
          SqlParameter("String", actionType),
          SqlParameter("String", actionDetail),
          SqlParameter("DateTime", actionTime.getMillis.toString)
        )
      }
      _ <- IO(logger.info(
        s"记录操作日志 SQL: ${insertLogSQL}, 参数: logID=${logID}, actionType=${actionType}, actionDetail=${actionDetail}, actionTime=${actionTime}"
      ))
      logResult <- writeDB(insertLogSQL, insertLogParams)
      _ <- IO(logger.info(s"操作日志记录完成: ${logResult}"))
  
    } yield "状态更新成功！"
  }
}