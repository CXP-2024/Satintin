package Impl


import Objects.UserService.UserRole
import Utils.UserAuthenticationProcess.generateToken
import Objects.UserService.User
import Utils.UserAuthenticationProcess.validatePassword
import Utils.UserManagementProcess.getUserByID
import Utils.UserAuthenticationProcess.generateSaltedPassword
import Utils.UserAuthenticationProcess.validateVerificationCode
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import org.joda.time.DateTime
import io.circe._
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
import Utils.UserAuthenticationProcess.validateVerificationCode
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class LoginUserMessagePlanner(
                                    userName: String,
                                    password: String,
                                    verificationCode: Option[String], // 验证码作为类参数传入
                                    override val planContext: PlanContext
                                  ) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] =
    for {
      // Step 1: 验证手机号验证码合法性
      _ <- IO(logger.info(s"验证用户登录输入是否合法，userName=${userName}"))
      _ <- validateVerificationCodeStep()

      // Step 2: 获取用户信息
      _ <- IO(logger.info(s"根据用户名查找用户信息，userName=${userName}"))
      user <- getUserInfo()

      // Step 3: 验证密码
      _ <- IO(logger.info(s"验证用户输入的密码是否正确，userID=${user.userID}"))
      _ <- validateUserPassword(user)

      // Step 4: 生成登录Token
      _ <- IO(logger.info(s"为用户生成登录Token，userID=${user.userID}"))
      token <- generateToken(user.userID)

      _ <- IO(logger.info(s"登录流程结束，返回生成的Token=${token}"))
    } yield token

  // Step 1: 验证手机号验证码
  private def validateVerificationCodeStep()(using PlanContext): IO[Unit] =
    if (userName.matches("^[0-9]+$")) verificationCode match {
      case Some(code) =>
        for {
          result <- validateVerificationCode(userName, code)
          _ <- IO {
            if (!result.contains("验证成功")) {
              logger.error(s"手机号验证码验证失败，userName=${userName}, result=${result}")
              throw new IllegalStateException(s"验证码验证失败：${result}")
            }
          }
        } yield ()
      case None =>
        IO(logger.error(s"未提供验证码，userName=${userName}")) >>
          IO.raiseError(new IllegalArgumentException("必须提供验证码进行验证"))
    }
    else IO.unit // 如果`userName`不是手机号，则不验证验证码

  // Step 2: 获取用户信息
  private def getUserInfo()(using PlanContext): IO[User] = {
    val sqlQuery =
      s"""
        SELECT user_id, name, id_card, phone_number, role, created_at, updated_at
        FROM ${schemaName}.user_table
        WHERE id_card = ? OR phone_number = ?;
      """
    val parameters = List(
      SqlParameter("String", userName),
      SqlParameter("String", userName)
    )

    for {
      userJsonOpt <- readDBJsonOptional(sqlQuery, parameters)
      user <- userJsonOpt match {
        case Some(json) => IO(decodeType[User](json))
        case None =>
          val errorMsg = s"根据用户名查找不到用户信息：userName=${userName}"
          IO(logger.error(errorMsg)) >> IO.raiseError(new NoSuchElementException(errorMsg))
      }
    } yield user
  }

  // Step 3: 验证输入密码
  private def validateUserPassword(user: User)(using PlanContext): IO[Unit] = {
    val sqlQuery =
      s"""
        SELECT salt, password_hash
        FROM ${schemaName}.user_password_table
        WHERE user_id = ?;
      """
    val parameters = List(SqlParameter("String", user.userID))

    for {
      passwordInfoOpt <- readDBJsonOptional(sqlQuery, parameters)
      isValid <- passwordInfoOpt match {
        case Some(json) =>
          val storedSalt = decodeField[String](json, "salt")
          val storedSaltedPassword = decodeField[String](json, "password_hash")

          validatePassword(password, storedSalt, storedSaltedPassword)
        case None =>
          val errorMsg = s"用户密码信息缺失，userID=${user.userID}"
          IO(logger.error(errorMsg)) >> IO.raiseError(new NoSuchElementException(errorMsg))
      }
      _ <- IO {
        if (!isValid) {
          logger.error(s"用户输入密码验证失败，userID=${user.userID}")
          throw new IllegalArgumentException("用户密码验证失败")
        }
      }
    } yield ()
  }

}