package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.UserStatusProcess.updateBanStatus
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe.Json
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import org.joda.time.DateTime
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
import Utils.UserStatusProcess.updateBanStatus
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class ModifyUserStatusMessagePlanner(
    adminToken: String,
    userID: String,
    banDays: Int,
    override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // 验证管理员权限
      _ <- IO(logger.info(s"[Step 1] 验证管理员 adminToken=${adminToken} 的权限"))
      isAdmin <- validateAdminPermission()
      _ <- IO(logger.info(s"管理员权限校验结果: ${isAdmin}"))
      _ <- if (!isAdmin) IO.raiseError(new IllegalAccessException("调用者无管理员权限")) else IO.unit

      // 更新用户封禁状态
      _ <- IO(logger.info(s"[Step 2] 调用 updateBanStatus 方法更新用户 ${userID} 的封禁天数为 ${banDays}"))
      updateResult <- updateBanStatus(userID, banDays)
      _ <- IO(logger.info(s"updateBanStatus 更新结果: ${updateResult}"))

    } yield "用户状态修改成功！"
  }

  private def validateAdminPermission()(using PlanContext): IO[Boolean] = {
    val querySql =
      s"""
         SELECT permission_level
         FROM ${schemaName}.user_table
         WHERE user_id = ?;
       """
    val parameters = List(SqlParameter("String", adminToken))

    for {
      _ <- IO(logger.info(s"[validateAdminPermission] 执行权限校验 SQL: ${querySql}, 参数: adminToken=${adminToken}"))
      jsonOpt <- readDBJsonOptional(querySql, parameters)
      permissionLevel = jsonOpt.map(decodeField[Int](_, "permission_level"))
      result <- IO {
        permissionLevel.contains(1) // 假设权限等级为1表示管理员
      }
      _ <- if (!result) IO(logger.warn(s"用户 ${adminToken} 尝试执行管理员操作，但权限不足")) else IO.unit
    } yield result
  }
}