package Utils

import Common.API.PlanContext
import Common.DBAPI._
import Common.Object.SqlParameter
import cats.effect.IO
import org.slf4j.LoggerFactory

case object UserValidationProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 验证用户ID是否存在
   */
  def validateUserExists(userID: String)(using PlanContext): IO[Unit] = {
    for {
      _ <- IO(logger.info(s"[validateUserExists] 开始验证用户ID: ${userID}"))
      
      _ <- IO {
        if (userID.isEmpty) 
          throw new IllegalArgumentException("用户ID不能为空")
      }
      
      userOpt <- readDBJsonOptional(
        s"SELECT user_id FROM userservice.user_table WHERE user_id = ?",
        List(SqlParameter("String", userID))
      )
      
      _ <- userOpt match {
        case Some(_) =>
          IO(logger.info(s"[validateUserExists] 用户验证成功: ${userID}"))
        case None =>
          IO(logger.error(s"[validateUserExists] 用户不存在: ${userID}")) >>
          IO.raiseError(new IllegalArgumentException(s"用户不存在: ${userID}"))
      }
    } yield ()
  }
}