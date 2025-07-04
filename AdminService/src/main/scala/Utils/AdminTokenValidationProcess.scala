package Utils

import Common.API.PlanContext
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import Objects.AdminService.AdminAccount

case object AdminTokenValidationProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 验证管理员Token
   */
  def validateAdminToken(adminToken: String)(using PlanContext): IO[AdminAccount] = {
    for {
      _ <- IO(logger.info(s"[validateAdminToken] 开始验证管理员Token"))
      
      _ <- IO {
        if (adminToken.isEmpty) 
          throw new IllegalArgumentException("adminToken不能为空")
      }
      
      adminOpt <- readDBJsonOptional(
        s"SELECT admin_id, account_name, password_hash, create_time FROM ${schemaName}.admin_account_table WHERE token = ? AND is_active = true",
        List(SqlParameter("String", adminToken))
      )
      
      adminAccount <- adminOpt match {
        case Some(json) =>
          for {
            adminAccount <- IO(decodeType[AdminAccount](json))
            _ <- IO(logger.info(s"[validateAdminToken] 管理员验证成功: ${adminAccount.accountName}"))
          } yield adminAccount
        case None =>
          IO(logger.error(s"[validateAdminToken] 无效的adminToken")) >>
          IO.raiseError(new IllegalAccessException("无效的管理员Token"))
      }
    } yield adminAccount
  }
}