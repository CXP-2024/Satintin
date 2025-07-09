package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import Objects.UserService.{MessageEntry, User, BlackEntry, FriendEntry}
import Utils.UserRegistrationProcess.validateRegistrationInput
import Common.API.{PlanContext, Planner}
import Common.Object.{SqlParameter, ParameterList}
import cats.effect.IO
import java.util.UUID
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}


case object UserRegistrationProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  def createUserRecord(userInput: User)(using PlanContext): IO[User] = {
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
  
      // Step 2.2: Map userInput fields to User fields
      userRecord <- IO {
        User(
          userID = uniqueUserID,
          userName = userInput.userName,
          passwordHash = userInput.passwordHash,
          email = userInput.email,
          phoneNumber = userInput.phoneNumber,
          registerTime = userInput.registerTime,
          permissionLevel = userInput.permissionLevel,
          banDays = userInput.banDays,
          isOnline = userInput.isOnline,
          matchStatus = userInput.matchStatus,
          stoneAmount = userInput.stoneAmount,
          cardDrawCount = userInput.cardDrawCount,
          rank = userInput.rank,
          rankPosition = userInput.rankPosition,
          friendList = userInput.friendList,
          blackList = userInput.blackList,
          messageBox = userInput.messageBox,
        )
      }
      _ <- IO(logger.info(s"[Step 2.2] 将用户输入映射为User记录：userRecord=${userRecord}"))
  
      // Step 2.3: Write user information into the database
      _ <- IO(logger.info("[Step 2.3] 开始写入用户信息到数据库"))
      writeResult <- writeDB(
        s"""
        INSERT INTO ${schemaName}.user_table
        (user_id, username, password_hash, email, phone_number, register_time, permission_level, ban_days, is_online, match_status, usertoken)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """.stripMargin,
        List(
          SqlParameter("String", userRecord.userID),
          SqlParameter("String", userRecord.userName),
          SqlParameter("String", userRecord.passwordHash),
          SqlParameter("String", userRecord.email),
          SqlParameter("String", userRecord.phoneNumber),
          SqlParameter("DateTime", userRecord.registerTime.getMillis.toString),
          SqlParameter("Int", userRecord.permissionLevel.toString),
          SqlParameter("Int", userRecord.banDays.toString),
          SqlParameter("Boolean", userRecord.isOnline.toString),
          SqlParameter("String", userRecord.matchStatus),
          SqlParameter("String", "") // 直接设置为空字符串，不再从userInput.usertoken获取
        )
      )
      _ <- IO(logger.info(s"[Step 2.3] 用户信息写入数据库成功：writeResult=${writeResult}"))

      // Step 2.4: Create user asset record with default values
      _ <- IO(logger.info("[Step 2.4] 开始写入用户资产信息到数据库"))
      assetResult <- writeDB(
        s"""
        INSERT INTO ${schemaName}.user_asset_table
        (user_id, stone_amount, card_draw_count, rank, rank_position)
        VALUES (?, ?, ?, ?, ?)
        """.stripMargin,
        List(
          SqlParameter("String", userRecord.userID),
          SqlParameter("Int", userRecord.stoneAmount.toString),
          SqlParameter("Int", userRecord.cardDrawCount.toString),
          SqlParameter("String", userRecord.rank),
          SqlParameter("Int", userRecord.rankPosition.toString)
        )
      )
      _ <- IO(logger.info(s"[Step 2.4] 用户资产信息写入数据库成功：assetResult=${assetResult}"))

      // Step 2.5: Create user social record with empty lists
      _ <- IO(logger.info("[Step 2.5] 开始写入用户社交信息到数据库"))
      socialResult <- writeDB(
        s"""
        INSERT INTO ${schemaName}.user_social_table
        (user_id, friend_list, black_list, message_box)
        VALUES (?, ?::jsonb, ?::jsonb, ?::jsonb)
        """.stripMargin,
        List(
          SqlParameter("String", userRecord.userID),
          SqlParameter("String", "[]"), // Empty friend list as JSON array
          SqlParameter("String", "[]"), // Empty black list as JSON array
          SqlParameter("String", "[]")  // Empty message box as JSON array
        )
      )
      _ <- IO(logger.info(s"[Step 2.5] 用户社交信息写入数据库成功：socialResult=${socialResult}"))
  
      // Step 3: Return the created User object
      _ <- IO(logger.info("[Step 3] 返回创建的用户记录"))
    } yield userRecord
  }



  def validateRegistrationInput(
                                 username: String,
                                 password: String,
                                 email: String,
                                 phoneNumber: Option[String]
                               )(using PlanContext): IO[Boolean] = {
    // val logger = LoggerFactory.getLogger("validateRegistrationInput")  // 同文后端处理: logger 统一

    // Logging the start of validation and then proceed with validation
    IO(logger.info(s"[Validation] 开始验证注册输入：用户名=${username}，邮箱=${email}，电话=${phoneNumber.getOrElse("None")}， password=${password}")) >>
    // Regular expressions for validation
    IO {
      val emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$".r
      val phoneRegex = "^[0-9]{10,15}$".r

      // List to collect validation errors
      val errors = scala.collection.mutable.ListBuffer.empty[String]

      // Validate username
      if (username.isEmpty) errors += "用户名不能为空"
      if (username.length < 3 || username.length > 20) errors += "用户名长度必须在3到20个字符之间"

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