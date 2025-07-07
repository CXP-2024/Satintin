package Utils

import Common.API.PlanContext
import Common.DBAPI._
import Common.Object.SqlParameter
import cats.effect.IO
import org.slf4j.LoggerFactory
import APIs.UserService.GetUserInfoMessage

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
      
      // 使用 GetUserInfoMessage 来验证用户是否存在
      _ <- GetUserInfoMessage(userID).send.map { userInfo =>
        logger.info(s"[validateUserExists] 用户验证成功: ${userID}, 用户名: ${userInfo.userName}")
      }.handleErrorWith { error =>
        IO(logger.error(s"[validateUserExists] 用户不存在: ${userID}, 错误: ${error.getMessage}")) >>
        IO.raiseError(new IllegalArgumentException(s"用户不存在: ${userID}"))
      }
    } yield ()
  }
}