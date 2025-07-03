package Utils

import Common.API.PlanContext
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._

/**
 * UserTokenValidator
 * 专门用于验证usertoken并获取对应的userID的工具组件
 */
object UserTokenValidator {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 通过usertoken获取对应的userID
   * @param userToken 用户登录时生成的UUID token
   * @return IO[String] 返回对应的userID
   * @throws IllegalArgumentException 当usertoken无效时抛出异常
   */
  def getUserIDFromToken(userToken: String)(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"[UserTokenValidator] 开始验证usertoken: ${userToken.substring(0, 10)}..."))
      
      userResultOpt <- readDBJsonOptional(
        s"SELECT user_id, username, is_online FROM ${schemaName}.user_table WHERE usertoken = ?;",
        List(SqlParameter("String", userToken))
      )
      
      userID <- userResultOpt match {
        case Some(json) =>
          // 修复JSON字段访问方式 - 使用驼峰命名的字段名
          val userIDResult = json.hcursor.get[String]("userID")  // 改为 userID
          val usernameResult = json.hcursor.get[String]("username")
          val isOnlineResult = json.hcursor.get[Boolean]("isOnline")  // 改为 isOnline
          
          for {
            _ <- IO(logger.info(s"[UserTokenValidator] JSON解析结果: userIDResult=${userIDResult}, usernameResult=${usernameResult}, isOnlineResult=${isOnlineResult}"))
            result <- userIDResult match {
              case Right(userID) if userID.nonEmpty =>
                val username = usernameResult.getOrElse("")
                val isOnline = isOnlineResult.getOrElse(false)
                IO(logger.info(s"[UserTokenValidator] usertoken验证成功: userID=${userID}, username=${username}, isOnline=${isOnline}")) >> 
                IO.pure(userID)
              case _ =>
                IO(logger.error(s"[UserTokenValidator] 用户数据解析失败: usertoken=${userToken}, userIDResult=${userIDResult}")) >>
                IO.raiseError(new IllegalArgumentException("用户数据解析失败"))
            }
          } yield result
        case None =>
          IO(logger.error(s"[UserTokenValidator] 无效的usertoken: ${userToken}")) >>
          IO.raiseError(new IllegalArgumentException(s"无效的usertoken: ${userToken}"))
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
      _ <- IO(logger.info(s"[UserTokenValidator] 检查usertoken有效性: ${userToken.substring(0, 10)}..."))
      
      userResultOpt <- readDBJsonOptional(
        s"SELECT user_id FROM ${schemaName}.user_table WHERE usertoken = ? AND usertoken IS NOT NULL AND usertoken != '';",
        List(SqlParameter("String", userToken))
      )
      
      isValid = userResultOpt.isDefined
      _ <- IO(logger.info(s"[UserTokenValidator] usertoken有效性: ${isValid}"))
    } yield isValid
  }
}