package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Objects.AdminService.AdminAccount
import cats.effect.IO
import org.slf4j.LoggerFactory
import java.util.UUID

/**
 * 通过超级管理员Token创建新管理员
 * @param superAdminToken 超级管理员Token
 * @param username 新管理员用户名
 * @param passwordHash 新管理员密码hash
 */
case class CreateAdminMessagePlanner(
  superAdminToken: String,
  username: String,
  passwordHash: String,
  override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    val validateSql =
      s"""
        SELECT admin_id
        FROM ${schemaName}.admin_account_table
        WHERE token = ? AND is_active = true AND admin_id = '00000000-0000-0000-0000-000000000000'
      """.stripMargin

    val insertSql =
      s"""
        INSERT INTO ${schemaName}.admin_account_table
          (admin_id, account_name, password_hash, token, is_active, create_time)
        VALUES (?, ?, ?, ?, true, NOW())
        RETURNING admin_id
      """.stripMargin

    val validateParams = List(SqlParameter("String", superAdminToken))

    for {
      _        <- IO(logger.info(s"创建管理员前：验证管理员 token=$superAdminToken"))
      rows     <- readDBRows(validateSql, validateParams)
      _        <- if (rows.isEmpty)
                    IO.raiseError(new IllegalStateException("无效管理员 Token"))
                  else IO.unit

      newAdminId = UUID.randomUUID().toString
      _        <- IO(logger.info(s"管理员 token 验证成功，开始插入新管理员 username=$username"))
      created  <- readDBRows(insertSql,
                    List(
                      SqlParameter("String", newAdminId),
                      SqlParameter("String", username),
                      SqlParameter("String", passwordHash),
                      SqlParameter("String", UUID.randomUUID().toString)
                    ))
      // JSON uses camelCase key "adminID" for the returned column
      resultId <- created.head.hcursor.get[String]("adminID") match {
                    case Right(id) => IO.pure(id)
                    case Left(err) => IO.raiseError(new IllegalStateException(s"新管理员 ID 解析失败: ${err.getMessage}"))
                  }
      _        <- IO(logger.info(s"创建管理员成功，newAdminId=$resultId"))
    } yield resultId
  }
}
