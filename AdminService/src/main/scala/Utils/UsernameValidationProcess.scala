package Utils

import Common.API.PlanContext
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import APIs.UserService.QueryIDByUserNameMessage
import io.circe.generic.auto.deriveEncoder

case object UsernameValidationProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 验证用户名是否与管理员或用户重名
   */
  def validateUsernameAvailability(username: String, isAdmin: Boolean = false)(using PlanContext): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"[validateUsernameAvailability] 开始验证用户名: ${username}"))
      
      _ <- IO {
        if (username.isEmpty) 
          throw new IllegalArgumentException("用户名不能为空")
        if (username.length < 3)
          throw new IllegalArgumentException("用户名至少需要3个字符")
      }
      
      // 检查管理员表中是否已存在该账号名
      adminExists <- checkAdminNameExists(username)
      
      // 检查用户表中是否已存在该用户名
      userExists <- checkUserNameExists(username)
      
      _ <- if (adminExists || userExists) {
        val conflictType = if (adminExists) "管理员账号名" else "用户名"
        val errorMsg = if (isAdmin) {
          s"管理员账号名与${conflictType}冲突"
        } else {
          s"用户名与${conflictType}冲突"
        }
        IO(logger.warn(s"用户名 ${username} 冲突: ${errorMsg}")) >>
        IO.raiseError(new IllegalArgumentException(errorMsg))
      } else {
        IO(logger.info(s"用户名 ${username} 可用"))
      }
    } yield ()
  }

  /**
   * 检查管理员表中是否已存在该账号名
   */
  private def checkAdminNameExists(username: String)(using PlanContext): IO[Boolean] = {
    val adminQuery = s"SELECT admin_id FROM ${schemaName}.admin_account_table WHERE account_name = ?"
    val parameters = List(SqlParameter("String", username))
    
    readDBJsonOptional(adminQuery, parameters).map(_.nonEmpty)
  }  /**
   * 检查用户表中是否已存在该用户名
   */
  private def checkUserNameExists(username: String)(using PlanContext): IO[Boolean] = {
    QueryIDByUserNameMessage(username).send.map(_ => true).handleError(_ => false)
  }
}