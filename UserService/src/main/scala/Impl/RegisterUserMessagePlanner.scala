package Impl

import Utils.UserRegistrationProcess.{createUserRecord, validateRegistrationInput}
import Objects.UserService.{User, FriendEntry, BlackEntry, MessageEntry}
import Common.API.{PlanContext, Planner}
import Common.DBAPI.{readDBJsonOptional, writeDB}
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import java.util.UUID
import org.joda.time.DateTime
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class RegisterUserMessagePlanner(
    username: String,
    passwordHash: String,
    email: String,
    phoneNumber: String,
    override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate registration input
      _ <- IO(logger.info(s"[Step 1] 开始验证用户输入: username=${username}, email=${email}, phoneNumber=${phoneNumber}"))
      isValid <- validateRegistrationInput(username, passwordHash, email, Some(phoneNumber))
      _ <- if (!isValid) 
        IO.raiseError(new IllegalArgumentException("输入验证失败")) 
      else 
        IO(logger.info("[Step 1] 输入验证通过"))

      // Step 2: Ensure username uniqueness
      _ <- IO(logger.info(s"[Step 2] 检查用户名是否已存在: username=${username}"))
      isUsernameTaken <- checkUsernameExists(username)
      _ <- if (isUsernameTaken) 
        IO.raiseError(new IllegalArgumentException("用户名已存在")) 
      else 
        IO(logger.info("[Step 2] 用户名未被占用"))

      // Step 3: Create new user record using UserRegistrationProcess
      _ <- IO(logger.info("[Step 3] 开始创建用户记录"))
      userRecord <- createUserRecord(createUserInput())
      
      // Step 4: Return the newly created userID
      _ <- IO(logger.info(s"[Step 4] 用户创建成功，返回 userID=${userRecord.userID}"))
    } yield userRecord.userID
  }

  // Create a User object with the registration data
  private def createUserInput(): User = {
    User(
      userID = "", // Will be generated by createUserRecord
      userName = username,
      passwordHash = passwordHash,
      email = email,
      phoneNumber = phoneNumber,
      registerTime = DateTime.now,
      permissionLevel = 0,
      banDays = 0,
      isOnline = false,
      matchStatus = "Idle",
      stoneAmount = 10000,
      credits = 0,
      rank = "黑铁",
      rankPosition = 0,
      friendList = List.empty,
      blackList = List.empty,
      messageBox = List.empty
    )
  }
  // Function: Check if the username already exists in the database or conflicts with admin accounts
  private def checkUsernameExists(username: String)(using PlanContext): IO[Boolean] = {
    val userQuery = s"SELECT user_id FROM ${schemaName}.user_table WHERE username = ?"
    val adminQuery = s"SELECT admin_id FROM adminservice.admin_account_table WHERE account_name = ?"
    val parameters = List(SqlParameter("String", username))
    
    for {
      // 检查用户表中是否已存在该用户名
      userExists <- readDBJsonOptional(userQuery, parameters).map(_.nonEmpty)
      
      // 检查管理员表中是否已存在该账号名
      adminExists <- readDBJsonOptional(adminQuery, parameters).map(_.nonEmpty)
      
      // 如果在用户表或管理员表中任一存在，则返回true
      exists = userExists || adminExists
      
      _ <- if (exists) {
        if (userExists) {
          IO(logger.warn(s"用户名 ${username} 已在用户表中存在"))
        } else {
          IO(logger.warn(s"用户名 ${username} 与管理员账号名冲突"))
        }
      } else {
        IO(logger.info(s"用户名 ${username} 可用"))
      }
    } yield exists
  }
}