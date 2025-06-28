package Impl


import Objects.UserService.UserRole
import Utils.UserAuthenticationProcess.generateSaltedPassword
import Utils.UserManagementProcess.createUser
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
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
import Utils.UserManagementProcess.createUser
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class RegisterUserMessagePlanner(
                                       idCard: String,
                                       phoneNumber: String,
                                       name: String,
                                       password: String,
                                       override val planContext: PlanContext
                                     ) extends Planner[String] { // 返回值为生成的userID
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: 调用createUser方法创建用户记录和密码记录
      _ <- IO(logger.info(s"调用createUser方法创建用户记录和密码记录，idCard=${idCard}, phoneNumber=${phoneNumber}, name=${name}"))
      userID <- createUserData()

      // Step 2: 返回生成的userID
      _ <- IO(logger.info(s"用户注册成功，生成的userID=${userID}"))
    } yield userID
  }

  private def createUserData()(using PlanContext): IO[String] = {
    // 调用createUser方法，用户角色固定为NormalUser
    val role: UserRole = UserRole.NormalUser
    createUser(idCard, phoneNumber, role, password)
  }
}