package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory

/**
 * 管理员登录, 验证账号和密码，返回 token
 * @param accountName 管理员账号名
 * @param passwordHash 密码哈希
 */
case class LoginAdminMessagePlanner(
  accountName: String,
  passwordHash: String,
  override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    val sql =
      s"""
SELECT token
FROM ${schemaName}.admin_account_table
WHERE account_name = ? AND password_hash = ? AND is_active = true
      """.stripMargin
    val params = List(SqlParameter("String", accountName), SqlParameter("String", passwordHash))
    for {
      _    <- IO(logger.info(s"管理员登录验证: accountName=$accountName"))
      opt  <- readDBJsonOptional(sql, params)
      token <- opt match {
        case Some(jsonVal) =>
          // 从 JSON 对象中提取 token 字段
          jsonVal.hcursor.get[String]("token") match {
            case Right(str) => IO.pure(str)
            case Left(err)  => IO.raiseError(new IllegalStateException(s"从数据库返回的 token 解析失败: ${err.getMessage}"))
          }
        case None =>
          logger.error(s"管理员登录失败: 无效账号或密码")
          IO.raiseError(new IllegalArgumentException("账号或密码错误或账户未激活"))
      }
      _    <- IO(logger.info(s"管理员登录成功, token=$token"))
    } yield token
  }
}
