package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Objects.AdminService.AdminAccount
import Utils.{AdminTokenValidationProcess, UsernameValidationProcess}
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
    val insertSql =
      s"""
        INSERT INTO ${schemaName}.admin_account_table
          (admin_id, account_name, password_hash, token, is_active, create_time)
        VALUES (?, ?, ?, ?, true, NOW())
        RETURNING admin_id
      """.stripMargin

    for {
      // Step 1: 验证超级管理员Token - 使用Utils
      _ <- IO(logger.info(s"[Step 1] 验证超级管理员Token"))
      adminAccount <- AdminTokenValidationProcess.validateAdminToken(superAdminToken)
      
      // Step 2: 验证是否为超级管理员
      _ <- IO {
        if (adminAccount.adminID != "00000000-0000-0000-0000-000000000000") {
          throw new IllegalStateException("只有超级管理员可以创建新管理员")
        }
      }
      _ <- IO(logger.info(s"[Step 1] 超级管理员验证成功: ${adminAccount.accountName}"))

      // Step 3: 验证用户名是否重复 - 使用Utils
      _ <- IO(logger.info(s"[Step 2] 验证用户名是否重复: username=$username"))
      _ <- UsernameValidationProcess.validateUsernameAvailability(username, isAdmin = true)
      _ <- IO(logger.info(s"[Step 2] 用户名验证通过，无重复"))

      // Step 4: 创建新管理员
      newAdminId = UUID.randomUUID().toString
      _ <- IO(logger.info(s"[Step 3] 开始创建新管理员 username=$username"))
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
      _ <- IO(logger.info(s"[Step 3] 创建管理员成功，newAdminId=$resultId"))
    } yield resultId
  }
}
