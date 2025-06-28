package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import cats.implicits.*
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.API.PlanContext
import Objects.UserService.UserRole
import Utils.UserAuthenticationProcess.generateSaltedPassword
import Common.Object.{ParameterList, SqlParameter}
import Objects.UserService.User
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import cats.implicits._
import Common.API.{PlanContext}

case object UserManagementProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  
  def getUserIDByToken(userToken: String)(using PlanContext): IO[String] = {
    logger.info(s"开始处理getUserIDByToken请求，userToken: ${userToken}")
  
    // 验证输入参数 userToken 的有效性
    if (userToken.trim.isEmpty) {
      logger.error("User token 为空或仅包含空格")
      IO.raiseError(new IllegalArgumentException("Invalid userToken: Token cannot be empty or null"))
    } else {
      logger.info(s"userToken 格式验证成功: ${userToken}")
  
      val sql =
        s"""
          SELECT user_id, expires_at
          FROM ${schemaName}.login_token_table
          WHERE token = ?
        """
      val dbParams = List(SqlParameter("String", userToken))
  
      for {
        _ <- IO(logger.info(s"SQL 查询语句: ${sql}，参数: ${dbParams.map(_.value).mkString(", ")}"))
        queryResult <- readDBJsonOptional(sql, dbParams) // 查询数据库
        userID <- queryResult match {
          // Token 存在，检查是否过期
          case Some(json) =>
            for {
              userIDFromDB <- IO(decodeField[String](json, "user_id"))
              expiresAtFromDB <- IO(decodeField[DateTime](json, "expires_at"))
              _ <- if (expiresAtFromDB.isBeforeNow) {
                IO(logger.error(s"Token [${userToken}] 已过期（过期时间: ${expiresAtFromDB}）")) >>
                IO.raiseError(new IllegalArgumentException("Invalid userToken: Token has expired"))
              } else {
                IO(logger.info(s"Token [${userToken}] 有效，对应用户ID: ${userIDFromDB}"))
              }
            } yield userIDFromDB
  
          // Token 不存在
          case None =>
            val errorMessage = s"Token [${userToken}] 在LoginTokenTable中未找到"
            IO(logger.error(errorMessage)) >>
            IO.raiseError(new IllegalArgumentException("Invalid userToken: Token not found"))
        }
      } yield userID
    }
  }
  
  
  def deleteUserRecord(userID: String)(using PlanContext): IO[String] = {
    for {
      // Step 1: 验证输入的userID是否存在
      _ <- IO(logger.info(s"[deleteUserRecord] 开始验证 userID=${userID} 是否存在"))
      userRecordOpt <- readDBJsonOptional(
        s"SELECT * FROM ${schemaName}.user_table WHERE user_id = ?",
        List(SqlParameter("String", userID))
      )
      _ <- userRecordOpt match {
        // 如果用户不存在，终止操作并报错
        case None =>
          IO(logger.info(s"[deleteUserRecord] userID=${userID} 不存在，终止操作")) >>
          IO.raiseError(new IllegalArgumentException(s"userID ${userID} does not exist."))
        // 如果用户存在，继续进行删除操作
        case Some(_) =>
          IO(logger.info(s"[deleteUserRecord] userID=${userID} 存在，继续进行删除操作"))
      }
  
      // Step 2.1: 从 UserTable 表中删除用户记录
      _ <- IO(logger.info(s"[deleteUserRecord] 准备从 UserTable 中删除 userID=${userID} 的记录"))
      deleteUserTableResult <- writeDB(
        s"DELETE FROM ${schemaName}.user_table WHERE user_id = ?",
        List(SqlParameter("String", userID))
      )
      _ <- IO(logger.info(s"[deleteUserRecord] 成功删除 UserTable 中 userID=${userID} 的记录，结果=${deleteUserTableResult}"))
  
      // Step 2.2: 从 UserPasswordTable 表中删除对应的密码记录
      _ <- IO(logger.info(s"[deleteUserRecord] 准备从 UserPasswordTable 中删除 userID=${userID} 的记录"))
      deleteUserPasswordTableResult <- writeDB(
        s"DELETE FROM ${schemaName}.user_password_table WHERE user_id = ?",
        List(SqlParameter("String", userID))
      )
      _ <- IO(logger.info(s"[deleteUserRecord] 成功删除 UserPasswordTable 中 userID=${userID} 的记录，结果=${deleteUserPasswordTableResult}"))
  
      // Step 3: 返回结果
      result <- IO(s"Successfully deleted user record for userID: ${userID}")
      _ <- IO(logger.info(s"[deleteUserRecord] 操作完成，返回结果：${result}"))
    } yield result
  }
  
  def createUser(idCard: String, phoneNumber: String, role: UserRole, password: String)(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger(getClass)  // 同文后端处理: logger 统一
  
    for {
      _ <- IO(logger.info("开始创建用户流程"))
  
      // Step 1: 生成加盐密码和盐值
      _ <- IO(logger.info("生成盐值"))
      salt <- IO(java.util.UUID.randomUUID().toString.replace("-", ""))
      _ <- IO(logger.info(s"生成的盐值为: ${salt}"))
  
      _ <- IO(logger.info("调用generateSaltedPassword生成加盐密码"))
      saltedPassword <- generateSaltedPassword(password, salt)
      _ <- IO(logger.info(s"生成的加盐密码为: ${saltedPassword}"))
  
      // Step 2: 在数据库中创建用户记录
      currentTime <- IO(DateTime.now())
  
      // Step 2.1: 在UserTable中插入用户的基本信息
      _ <- IO(logger.info("[UserTable] 准备插入用户基本信息"))
      userID <- IO(java.util.UUID.randomUUID().toString)
      userInsertSql <-
        IO(
          s"""
INSERT INTO ${schemaName}.user_table (user_id, name, id_card, phone_number, role, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?)
""".stripMargin)
      userInsertParams <- IO(
        List(
          SqlParameter("String", userID),
          SqlParameter("String", s"User_${phoneNumber}"),
          SqlParameter("String", idCard),
          SqlParameter("String", phoneNumber),
          SqlParameter("String", role.toString),
          SqlParameter("DateTime", currentTime.getMillis.toString),
          SqlParameter("DateTime", currentTime.getMillis.toString)
        ))
      _ <- IO(logger.info(s"[UserTable] 执行插入 SQL: ${userInsertSql}"))
      _ <- writeDB(userInsertSql, userInsertParams)
      _ <- IO(logger.info("[UserTable] 用户基本信息插入成功"))
  
      // Step 2.2: 在UserPasswordTable中插入加盐密码的信息
      _ <- IO(logger.info("[UserPasswordTable] 准备插入用户密码信息"))
      passwordInsertSql <-
        IO(
          s"""
INSERT INTO ${schemaName}.user_password_table (user_id, password_hash, salt, created_at, updated_at)
VALUES (?, ?, ?, ?, ?)
""".stripMargin)
      passwordInsertParams <- IO(
        List(
          SqlParameter("String", userID),
          SqlParameter("String", saltedPassword),
          SqlParameter("String", salt),
          SqlParameter("DateTime", currentTime.getMillis.toString),
          SqlParameter("DateTime", currentTime.getMillis.toString)
        ))
      _ <- IO(logger.info(s"[UserPasswordTable] 执行插入 SQL: ${passwordInsertSql}"))
      _ <- writeDB(passwordInsertSql, passwordInsertParams)
      _ <- IO(logger.info("[UserPasswordTable] 用户密码信息插入成功"))
  
      // Step 3: 返回生成的 userID
      _ <- IO(logger.info(s"用户创建完成，生成的userID为: ${userID}"))
    } yield userID
  }
  
  def getUserByID(userID: String)(using PlanContext): IO[User] = {
  // val logger = LoggerFactory.getLogger("getUserByID")  // 同文后端处理: logger 统一
  
    logger.info(s"开始根据用户ID获取用户信息，userID=${userID}")
  
    (if (userID == null || userID.trim.isEmpty) {
      IO(logger.error("用户ID为空或无效")) >>
      IO.raiseError(new IllegalArgumentException("用户ID不能为空"))
    } else if (!userID.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")) {
      IO(logger.error(s"用户ID格式非法，userID=${userID}")) >>
      IO.raiseError(new IllegalArgumentException("用户ID格式非法"))
    } else {
      val sqlQuery =
        s"""
           SELECT user_id, name, id_card, phone_number, role, created_at, updated_at
           FROM ${schemaName}.user_table
           WHERE user_id = ?;
         """
      val queryParameters = List(SqlParameter("String", userID))
  
      for {
        _ <- IO(logger.info(s"生成数据库查询SQL: ${sqlQuery}"))
        _ <- IO(logger.info(s"SQL参数：${queryParameters}"))
  
        userJsonOpt <- readDBJsonOptional(sqlQuery, queryParameters)
        user <- userJsonOpt match {
          case Some(json) =>
            for {
              _ <- IO(logger.info(s"成功查询到用户记录：${json}"))
              user <- IO {
                val userID = decodeField[String](json, "user_id")
                val name = decodeField[String](json, "name")
                val idCard = decodeField[String](json, "id_card")
                val phoneNumber = decodeField[String](json, "phone_number")
                val roleString = decodeField[String](json, "role")
                val createdAtMillis = decodeField[Long](json, "created_at")
                val updatedAtMillis = decodeField[Long](json, "updated_at")
  
                val role = UserRole.fromString(roleString)
                val createdAt = new DateTime(createdAtMillis)
                val updatedAt = new DateTime(updatedAtMillis)
  
                val user = User(
                  userID = userID,
                  name = name,
                  idCard = idCard,
                  phoneNumber = phoneNumber,
                  role = role,
                  createdAt = createdAt,
                  updatedAt = updatedAt
                )
                logger.info(s"成功解析用户信息为User对象：${user}")
                user
              }
            } yield user
  
          case None =>
            val errorMsg = s"无法找到对应userID的用户记录: userID=${userID}"
            IO(logger.error(errorMsg)) >>
            IO.raiseError(new NoSuchElementException(errorMsg))
        }
      } yield user
    })
  }
}
