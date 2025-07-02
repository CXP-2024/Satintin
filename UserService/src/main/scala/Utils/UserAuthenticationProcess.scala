package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import Common.API.{PlanContext, Planner}
import Common.Object.SqlParameter
import cats.effect.IO
import io.circe.Json
import java.util.UUID
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Common.Object.ParameterList
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.API.{PlanContext}
import Common.Object.{SqlParameter, ParameterList}
import Objects.UserService.MessageEntry
import Objects.UserService.User
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import Common.API.PlanContext

case object UserAuthenticationProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  
  def setOnlineStatus(userID: String, isOnline: Boolean)(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger("setOnlineStatus")  // 同文后端处理: logger 统一
  
    for {
      // Step 1: Log the start of execution
      _ <- IO(logger.info(s"[setOnlineStatus] 开始执行，将用户 ${userID} 的在线状态设置为 ${isOnline}"))
  
      // Step 2: Check if the user exists
      querySQL <- IO(s"SELECT * FROM ${schemaName}.user_table WHERE user_id = ?;")
      queryParams <- IO(List(SqlParameter("String", userID)))
      _ <- IO(logger.info(s"[setOnlineStatus] 查询用户是否存在 SQL: ${querySQL}，参数: ${queryParams.map(_.value).mkString(", ")}"))
      userOpt <- readDBJsonOptional(querySQL, queryParams)
      
      _ <- userOpt match {
        case None =>
          val errorMessage = s"[setOnlineStatus] 用户 ${userID} 不存在，操作终止"
          IO(logger.error(errorMessage)) >> IO.raiseError(new IllegalStateException("用户不存在"))
        case Some(_) =>
          IO(logger.info(s"[setOnlineStatus] 用户 ${userID} 存在，继续执行"))
      }
  
      // Step 3: Update the user's online status
      updateSQL <- IO(s"UPDATE ${schemaName}.user_table SET is_online = ? WHERE user_id = ?;")
      updateParams <- IO(List(
        SqlParameter("Boolean", isOnline.toString),
        SqlParameter("String", userID)
      ))
      _ <- IO(logger.info(s"[setOnlineStatus] 更新用户在线状态 SQL: ${updateSQL}，参数: ${updateParams.map(_.value).mkString(", ")}"))
      _ <- writeDB(updateSQL, updateParams)
  
      // Step 4: Record the user's operation log
      logSQL <- IO(s"""
        INSERT INTO ${schemaName}.user_operation_log_table (log_id, user_id, action_type, action_detail, action_time)
        VALUES (?, ?, ?, ?, ?);
      """)
      logParams <- IO(List(
        SqlParameter("String", UUID.randomUUID().toString),
        SqlParameter("String", userID),
        SqlParameter("String", "Online"),
        SqlParameter("String", s"用户在线状态设置为 ${isOnline}"),
        SqlParameter("DateTime", DateTime.now().getMillis.toString)
      ))
      _ <- IO(logger.info(s"[setOnlineStatus] 插入用户操作日志 SQL: ${logSQL}，参数: ${logParams.map(_.value).mkString(", ")}"))
      _ <- writeDB(logSQL, logParams)
  
      // Step 5: Return operation result
      resultMessage <- IO("用户在线状态更新成功！")
      _ <- IO(logger.info(s"[setOnlineStatus] 操作完成: ${resultMessage}"))
    } yield resultMessage
  }
  
  def authenticateUser(userName: String, password: String)(using PlanContext): IO[Option[User]] = {
  
    logger.info(s"开始验证用户登录身份，用户名: ${userName}")
  
    if (userName.isEmpty || password.isEmpty) {
      logger.warn("用户名或密码为空")
      IO.pure(None)
    } else {
      val sqlQuery = s"""
        SELECT * 
        FROM ${schemaName}.user_table 
        WHERE username = ?
      """
      val sqlParams = List(SqlParameter("String", userName))
  
      logger.info(s"验证用户名是否存在, SQL查询为: ${sqlQuery}, 参数: ${sqlParams.map(_.value).mkString("[", ", ", "]")}")
  
      for {
        userJsonOpt <- readDBJsonOptional(sqlQuery, sqlParams)
        userOpt <- userJsonOpt match {
          case Some(userJson) =>
            IO {
              val passwordHashFromDB = decodeField[String](userJson, "password_hash")
              logger.info(s"从数据库中读取username: ${userName} 的password_hash字段")
              
              if (passwordHashFromDB == password) {
                logger.info(s"密码验证成功，开始解码用户: ${userName} 的完整信息")
                Some(decodeType[User](userJson))
              } else {
                logger.warn(s"密码验证失败, 用户名: ${userName}")
                None
              }
            }
          case None =>
            logger.warn(s"未找到用户名为: ${userName} 的记录")
            IO.pure(None) // 用户名不存在
        }
      } yield userOpt
    }
  }
  
  
  def clearOnlineStatus(userID: String)(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger("clearOnlineStatus")  // 同文后端处理: logger 统一
    logger.info(s"[clearOnlineStatus] 开始处理 userID=${userID}")
  
    if (userID == null || userID.trim.isEmpty) {
      logger.info("[clearOnlineStatus] userID 为空或不合法，操作终止")
      IO.raiseError(new IllegalArgumentException("Invalid userID"))
    } else {
      val sqlQueryCheckUser =
        s"""
        SELECT user_id
        FROM ${schemaName}.user_table
        WHERE user_id = ?
        """
      val sqlQueryUpdateUserStatus =
        s"""
        UPDATE ${schemaName}.user_table
        SET is_online = false
        WHERE user_id = ?
        """
  
      for {
        // Step 1. 验证用户ID的有效性
        _ <- IO(logger.info(s"[clearOnlineStatus] 验证用户是否存在 userID=${userID}"))
        existingUserOpt <- readDBJsonOptional(
          sqlQueryCheckUser,
          List(SqlParameter("String", userID))
        )
  
        _ <- existingUserOpt match {
          case None =>
            val errorMsg = s"[clearOnlineStatus] 用户不存在 userID=${userID}"
            IO(logger.error(errorMsg)) >> IO.raiseError(new IllegalArgumentException(errorMsg))
          case Some(_) =>
            IO(logger.info(s"[clearOnlineStatus] 用户存在 userID=${userID}"))
        }
  
        // Step 2. 更新用户的在线状态
        _ <- IO(logger.info(s"[clearOnlineStatus] 更新用户在线状态为离线 userID=${userID}"))
        updateResult <- writeDB(
          sqlQueryUpdateUserStatus,
          List(SqlParameter("String", userID))
        )
  
        // Step 3. 返回操作结果
        _ <- IO(logger.info(s"[clearOnlineStatus] 操作完成，返回结果: ${updateResult}"))
      } yield "Success"
    }
  }
}
