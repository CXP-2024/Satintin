package Utils

import Common.API.PlanContext
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._

case object UserTokenValidationProcess {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 验证用户Token并返回UserID
   * 这个函数直接查询UserService的数据库
   */
  def validateUserToken(userToken: String)(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"[validateUserToken] 开始验证用户Token: ${userToken.substring(0, 10)}..."))
      
      // 查询UserService的user_table - 修复：查询更多字段以确保一致性
      userResultOpt <- readDBJsonOptional(
        s"SELECT user_id, username, is_online FROM userservice.user_table WHERE usertoken = ?;",
        List(SqlParameter("String", userToken))
      )
      
      userID <- userResultOpt match {
        case Some(json) =>
          // 修复：使用驼峰命名的字段名访问JSON
          val userIDResult = json.hcursor.get[String]("userID")  // 改为 userID
          val usernameResult = json.hcursor.get[String]("username")
          val isOnlineResult = json.hcursor.get[Boolean]("isOnline")  // 改为 isOnline
          
          for {
            _ <- IO(logger.info(s"[validateUserToken] JSON解析结果: userIDResult=${userIDResult}, usernameResult=${usernameResult}, isOnlineResult=${isOnlineResult}"))
            result <- userIDResult match {
              case Right(userID) if userID.nonEmpty =>
                val username = usernameResult.getOrElse("")
                val isOnline = isOnlineResult.getOrElse(false)
                IO(logger.info(s"[validateUserToken] Token验证成功: userID=${userID}, username=${username}, isOnline=${isOnline}")) >>
                IO.pure(userID)
              case _ =>
                IO(logger.error(s"[validateUserToken] 用户数据解析失败: userToken=${userToken}, userIDResult=${userIDResult}")) >>
                IO.raiseError(new IllegalArgumentException("用户数据解析失败"))
            }
          } yield result
        case None =>
          IO(logger.error(s"[validateUserToken] 无效的userToken: ${userToken}")) >>
          IO.raiseError(new IllegalArgumentException(s"无效的userToken: ${userToken}"))
      }
    } yield userID
  }

  /**
   * 验证usertoken是否有效（不返回userID，只验证有效性）
   * @param userToken 用户登录时生成的UUID token
   * @return IO[Boolean] 返回token是否有效
   */
  def isTokenValid(userToken: String)(using PlanContext): IO[Boolean] = {
    for {
      _ <- IO(logger.info(s"[validateUserToken] 检查usertoken有效性: ${userToken.substring(0, 10)}..."))
      
      userResultOpt <- readDBJsonOptional(
        s"SELECT user_id FROM userservice.user_table WHERE usertoken = ? AND usertoken IS NOT NULL AND usertoken != '';",
        List(SqlParameter("String", userToken))
      )
      
      isValid = userResultOpt.isDefined
      _ <- IO(logger.info(s"[validateUserToken] usertoken有效性: ${isValid}"))
    } yield isValid
  }
}