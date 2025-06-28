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
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import java.util.Base64
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.API.PlanContext
import Utils.UserAuthenticationProcess.generateSaltedPassword
import java.util.UUID
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Common.DBAPI.*
import io.circe.*
import io.circe.syntax.*
import io.circe.generic.auto.*

case object UserAuthenticationProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  
  def generateSaltedPassword(password: String, salt: String)(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger(getClass)  // 同文后端处理: logger 统一
  
    for {
      // Step 1: 验证输入参数的合法性
      _ <- IO {
        logger.info("验证输入参数: 检查 password 和 salt 是否为空")
        require(password.nonEmpty, "Password 不能为空")
        require(salt.nonEmpty, "Salt 不能为空")
      }
  
      _ <- IO(logger.info("输入参数验证成功，开始执行加盐处理"))
  
      // Step 2: 开始执行 PBKDF2 加密算法
      saltedPassword <- IO {
        logger.info("开始执行 PBKDF2 加密算法")
        val iterations = 10000 // PBKDF2 的迭代次数
        val keyLength = 256 // 生成的哈希长度
        val keySpec = new PBEKeySpec(password.toCharArray, salt.getBytes("UTF-8"), iterations, keyLength)
        val keyFactory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val hash = keyFactory.generateSecret(keySpec).getEncoded
  
        logger.info("加密完成，将生成的哈希值编码为 Base64 字符串")
        Base64.getEncoder.encodeToString(hash)
      }
  
      // Step 3: 返回加盐密码
      _ <- IO(logger.info("加盐密码已生成，返回加盐后的密码"))
    } yield saltedPassword // 输出加盐后的密码
  }
  
  def validatePassword(inputPassword: String, storedSalt: String, storedSaltedPassword: String)(using PlanContext): IO[Boolean] = {
  // val logger = LoggerFactory.getLogger(getClass)  // 同文后端处理: logger 统一
  
    for {
      // Step 1: 验证输入参数是否有效
      _ <- IO {
        if (inputPassword.isEmpty) {
          logger.error("输入密码为空，终止操作")
          throw new IllegalArgumentException("输入密码不能为空")
        }
        if (storedSalt.isEmpty) {
          logger.error("存储的盐值为空，终止操作")
          throw new IllegalArgumentException("存储的盐值不能为空")
        }
        if (storedSaltedPassword.isEmpty) {
          logger.error("存储的加盐密码为空，终止操作")
          throw new IllegalArgumentException("存储的加盐密码不能为空")
        }
        logger.info("输入参数验证通过，开始后续处理")
      }
  
      // Step 2: 将输入密码与盐值进行加盐处理
      saltedPassword <- generateSaltedPassword(inputPassword, storedSalt)
  
      _ <- IO {
        logger.info(s"生成的加盐密码: ${saltedPassword}")
        logger.info(s"存储的加盐密码: ${storedSaltedPassword}")
      }
  
      // Step 3: 比对加盐密码
      result <- IO {
        val isMatch = saltedPassword == storedSaltedPassword
        if (isMatch) {
          logger.info("输入密码与存储的加盐密码匹配")
        } else {
          logger.info("输入密码与存储的加盐密码不匹配")
        }
        isMatch
      }
    } yield result
  }
  
  
  def generateToken(userID: String)(using PlanContext): IO[String] = {
    // 初始化日志记录器
  // val logger = LoggerFactory.getLogger(getClass)  // 同文后端处理: logger 统一
  
    // Step 1: 生成随机的Token字符串
    logger.info(s"[GenerateToken] 开始为用户ID ${userID} 生成登录Token")
    val token = UUID.randomUUID().toString
    logger.info(s"[GenerateToken] 生成的Token为: ${token}")
  
    // Step 2: 设置Token的生效时间和过期时间
    val issuedAt = DateTime.now() // 当前Token生成时间
    val expiresAt = issuedAt.plusHours(2) // Token有效期为2小时
    logger.info(s"[GenerateToken] Token生效时间: ${issuedAt}, 过期时间: ${expiresAt}")
  
    // Step 3: 构造插入Token的SQL语句
    val sql =
      s"""
INSERT INTO ${schemaName}.login_token_table (token, user_id, issued_at, expires_at)
VALUES (?, ?, ?, ?)
""".stripMargin
  
    val parameters = List(
      SqlParameter("String", token),
      SqlParameter("String", userID),
      SqlParameter("DateTime", issuedAt.getMillis.toString),
      SqlParameter("DateTime", expiresAt.getMillis.toString)
    )
  
    // Step 4: 执行数据库操作并返回生成的Token
    logger.info(s"[GenerateToken] 准备往数据库插入新Token")
    for {
      _ <- writeDB(sql, parameters)
      _ <- IO(logger.info(s"[GenerateToken] Token成功插入数据库"))
    } yield token
  }
  
  
  def validateVerificationCode(phoneNumber: String, verificationCode: String)(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger(this.getClass)  // 同文后端处理: logger 统一
    val currentTime = DateTime.now() // 记录当前时间，用于日志和验证
    
    logger.info(s"开始验证手机号 ${phoneNumber} 的验证码")
    
    // Step 1: 从数据库获取指定手机号对应的验证码和过期时间
    val sqlQuery =
      s"""
         SELECT verification_code, expiry_time
         FROM ${schemaName}.user_table
         WHERE phone_number = ?
       """
    val parameters = List(SqlParameter("String", phoneNumber))
    
    for {
      _ <- IO(logger.info(s"查询数据库以获取验证码和过期时间，SQL: ${sqlQuery}, 参数: ${parameters}"))
      
      queryResult <- readDBJsonOptional(sqlQuery, parameters) // 查询数据库记录，返回Option类型
      
      result <- queryResult match {
        case Some(json) =>
          // 解码数据库返回的验证码和过期时间
          val dbVerificationCode = decodeField[String](json, "verification_code")
          val expiryTime = decodeField[DateTime](json, "expiry_time")
          
          if (currentTime.isAfter(expiryTime)) {
            logger.info(s"验证码已过期，当前时间: ${currentTime}, 过期时间: ${expiryTime}")
            IO.pure("验证失败: 验证码已过期")
          } else if (dbVerificationCode == verificationCode) {
            logger.info(s"验证码匹配成功，用户输入验证码: ${verificationCode}, 数据库验证码: ${dbVerificationCode}")
            IO.pure("验证成功")
          } else {
            logger.info(s"验证码不匹配，用户输入验证码: ${verificationCode}, 数据库验证码: ${dbVerificationCode}")
            IO.pure("验证失败: 验证码错误")
          }
          
        case None =>
          logger.info(s"未能在数据库中找到手机号为 ${phoneNumber} 的记录")
          IO.pure("验证失败: 数据库中未找到对应的验证码")
      }
    } yield result
  }
}
