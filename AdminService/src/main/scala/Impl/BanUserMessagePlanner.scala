package Impl


import Utils.ReportManagementProcess.banUser
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import org.joda.time.DateTime
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class BanUserMessagePlanner(adminToken: String, userID: String, banDays: Int, override val planContext: PlanContext) 
  extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"[开始执行用户封禁操作] adminToken=${adminToken}, userID=${userID}, banDays=${banDays}"))

      // Step 1: 验证管理员Token的权限
      _ <- validateAdminToken(adminToken)

      // Step 2: 执行封禁操作
      _ <- banUserAction(userID, banDays)

      // Step 3: 返回成功操作的信息
      _ <- IO(logger.info(s"[操作完成] 用户 ${userID} 成功被封禁 ${banDays} 天"))
    } yield "用户封禁成功！"
  }

  // 验证管理员权限
  private def validateAdminToken(adminToken: String)(using PlanContext): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"[Step 1] 验证管理员权限, adminToken=${adminToken}"))

      // SQL 查询
      sql <- IO(s"SELECT is_active FROM ${schemaName}.admin_account_table WHERE token = ?;")
      params <- IO(List(SqlParameter("String", adminToken)))

      // 检查是否具有管理员权限
      isAdmin <- readDBBoolean(sql, params)
      _ <- if (!isAdmin) {
        IO.raiseError(new IllegalStateException(s"权限验证失败，adminToken=${adminToken} 不具有管理员权限"))
      } else {
        IO(logger.info(s"[Step 1] 管理员权限验证成功, adminToken=${adminToken}"))
      }
    } yield ()
  }

  // 执行封禁用户操作
  private def banUserAction(userID: String, banDays: Int)(using PlanContext): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"[Step 2] 开始封禁用户 userID=${userID}, banDays=${banDays}"))
      result <- banUser(userID, banDays)
      _ <- IO(logger.info(s"[Step 2] 封禁操作完成，结果=${result}"))
    } yield ()
  }
}