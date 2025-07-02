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
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
import Common.DBAPI._
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.ServiceUtils.schemaName
import Utils.UserRegistrationProcess.createUserRecord
import Objects.UserService.MessageEntry
import Utils.UserRegistrationProcess.validateRegistrationInput
import Objects.UserService.User
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import Common.DBAPI._
import io.circe._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Objects.UserService.FriendEntry

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
      isValid <- validateInput(username, passwordHash, email, phoneNumber)
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

      // Step 3: Create new user record
      _ <- IO(logger.info("[Step 3] 开始创建用户记录"))
      userID <- createUserRecord()

      // Step 4: Return the newly created userID
      _ <- IO(logger.info(s"[Step 4] 用户创建成功，返回 userID=${userID}"))
    } yield userID
  }

  // Function: Validate the registration input
  private def validateInput(
      username: String, 
      passwordHash: String, 
      email: String, 
      phoneNumber: String
  )(using PlanContext): IO[Boolean] = {
    validateRegistrationInput(username, passwordHash, email, Some(phoneNumber))
  }

  // Function: Check if the username already exists in the database
  private def checkUsernameExists(username: String)(using PlanContext): IO[Boolean] = {
    val query = s"SELECT user_id FROM ${schemaName}.user_table WHERE username = ?"
    val parameters = List(SqlParameter("String", username))
    readDBJsonOptional(query, parameters).map(_.nonEmpty)
  }

  // Function: Create a new user record in the database
  private def createUserRecord()(using PlanContext): IO[String] = {
    val currentTime = DateTime.now
    val userID = UUID.randomUUID().toString

    val newUser = User(
      userID = userID,
      userName = username,
      passwordHash = passwordHash,
      email = email,
      phoneNumber = phoneNumber,
      registerTime = currentTime,
      permissionLevel = 0, // Default permission level for a new user
      banDays = 0,
      isOnline = false,
      matchStatus = "Idle",
      stoneAmount = 10000,
      cardDrawCount = 0,
      rank = "Bronze",
      rankPosition = 0,
      friendList = List.empty,
      blackList = List.empty,
      messageBox = List.empty
    )

    for {
      _ <- IO(logger.info(s"[Create Record] 准备创建用户记录: 用户名=${username}"))
      _ <- writeDB(
        s"""
        INSERT INTO ${schemaName}.user_table
        (user_id, username, password_hash, email, phone_number, register_time, 
        permission_level, ban_days, is_online, match_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """.stripMargin,
        List(
          SqlParameter("String", newUser.userID),
          SqlParameter("String", newUser.userName),
          SqlParameter("String", newUser.passwordHash),
          SqlParameter("String", newUser.email),
          SqlParameter("String", newUser.phoneNumber),
          SqlParameter("DateTime", newUser.registerTime.getMillis.toString),
          SqlParameter("Int", newUser.permissionLevel.toString),
          SqlParameter("Int", newUser.banDays.toString),
          SqlParameter("Boolean", newUser.isOnline.toString),
          SqlParameter("String", newUser.matchStatus.asJson.noSpaces)
        )
      )
      _ <- IO(logger.info(s"[Create Record] 用户记录创建成功: userID=${newUser.userID}"))
    } yield userID
  }
}