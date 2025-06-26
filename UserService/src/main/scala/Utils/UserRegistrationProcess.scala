package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import Objects.UserService.MessageEntry
import Utils.UserRegistrationProcess.validateRegistrationInput
import Objects.UserService.User
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import Common.API.{PlanContext, Planner}
import Common.Object.{SqlParameter, ParameterList}
import cats.effect.IO
import java.util.UUID
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import cats.implicits._
import Common.API.PlanContext

case object UserRegistrationProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  def createUserRecord(userInput: User)(using PlanContext): IO[UserTable] = {
  // val logger = LoggerFactory.getLogger("createUserRecord")  // 同文后端处理: logger 统一
  
    for {
      // Step 1: Validate user input
      _ <- IO(logger.info(s"[Step 1] 开始验证用户输入：userInput=${userInput}"))
      isValid <- validateRegistrationInput(userInput.userName, userInput.passwordHash, userInput.email, Some(userInput.phoneNumber))
      _ <- if (!isValid) {
        IO.raiseError(new IllegalArgumentException("用户输入验证失败"))
      } else {
        IO(logger.info("[Step 1] 用户输入验证通过"))
      }
  
      // Step 2.1: Generate a unique user ID
      uniqueUserID <- IO(UUID.randomUUID().toString)
      _ <- IO(logger.info(s"[Step 2.1] 生成唯一用户ID：uniqueUserID=${uniqueUserID}"))
  
      // Step 2.2: Map userInput fields to UserTable fields
      userTableRecord <- IO {
        UserTable(
          user_id = uniqueUserID,
          username = userInput.userName,
          password_hash = userInput.passwordHash,
          email = userInput.email,
          phone_number = userInput.phoneNumber,
          register_time = userInput.registerTime,
          permission_level = userInput.permissionLevel,
          ban_days = userInput.banDays,
          is_online = userInput.isOnline,
          match_status = userInput.matchStatus
        )
      }
      _ <- IO(logger.info(s"[Step 2.2] 将用户输入映射为UserTable记录：userTableRecord=${userTableRecord}"))
  
      // Step 2.3: Write user information into the database
      _ <- IO(logger.info("[Step 2.3] 开始写入用户信息到数据库"))
      writeResult <- writeDB(
        s"""
        INSERT INTO ${schemaName}.user_table
        (user_id, username, password_hash, email, phone_number, register_time, permission_level, ban_days, is_online, match_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """.stripMargin,
        List(
          SqlParameter("String", userTableRecord.user_id),
          SqlParameter("String", userTableRecord.username),
          SqlParameter("String", userTableRecord.password_hash),
          SqlParameter("String", userTableRecord.email),
          SqlParameter("String", userTableRecord.phone_number.getOrElse("")),
          SqlParameter("DateTime", userTableRecord.register_time.getMillis.toString),
          SqlParameter("Int", userTableRecord.permission_level.toString),
          SqlParameter("Int", userTableRecord.ban_days.toString),
          SqlParameter("Boolean", userTableRecord.is_online.toString),
          SqlParameter("String", userTableRecord.match_status.getOrElse(""))
        )
      )
      _ <- IO(logger.info(s"[Step 2.3] 用户信息写入数据库成功：writeResult=${writeResult}"))
  
      // Step 3: Return the created UserTable object
      _ <- IO(logger.info("[Step 3] 返回创建的用户记录"))
    } yield userTableRecord
  }
  
  
  def validateRegistrationInput(
      username: String,
      password: String,
      email: String,
      phoneNumber: Option[String]
  )(using PlanContext): IO[Boolean] = {
  // val logger = LoggerFactory.getLogger("validateRegistrationInput")  // 同文后端处理: logger 统一
  
    // Logging the start of validation
    IO(logger.info(s"[Validation] 开始验证注册输入：用户名=${username}，邮箱=${email}，电话=${phoneNumber.getOrElse("None")}")) >>
    
    // Regular expressions for validation
    IO {
      val usernameRegex = "^[a-zA-Z0-9_]{3,20}$".r
      val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$".r
      val phoneRegex = "^[0-9]{10,15}$".r
  
      // List to collect validation errors
      val errors = scala.collection.mutable.ListBuffer.empty[String]
  
      // Validate username
      if (username.isEmpty) errors += "用户名不能为空"
      if (username.length < 3 || username.length > 20) errors += "用户名长度必须在3到20个字符之间"
      if (!usernameRegex.matches(username)) errors += "用户名只能包含字母、数字和下划线"
  
      // Validate password
      if (password.isEmpty) errors += "密码不能为空"
      if (password.length < 8 || password.length > 32) errors += "密码长度必须在8到32个字符之间"
      if (!password.exists(_.isLetter) || !password.exists(_.isDigit)) errors += "密码必须同时包含字母和数字"
  
      // Validate email
      if (email.isEmpty) errors += "邮箱不能为空"
      if (!emailRegex.matches(email)) errors += "邮箱格式不正确"
  
      // Validate phone number (if exists)
      phoneNumber.foreach { phone =>
        if (!phoneRegex.matches(phone)) errors += "电话号码格式不合法，必须为10到15位数字"
      }
  
      errors
    }.flatMap { errors =>
      if (errors.nonEmpty) {
        // If there are errors, log them and return false
        IO {
          errors.foreach(error => logger.error(s"[Validation Error] ${error}"))
        } >> IO.pure(false)
      } else {
        // If validation passes, return true
        IO(logger.info("[Validation] 所有验证均通过")) >> IO.pure(true)
      }
    }
  }
}
