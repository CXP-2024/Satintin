package Impl


import Common.API.{PlanContext, Planner}
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.UserAuthenticationProcess.authenticateUser
import Objects.UserService.User
import org.slf4j.LoggerFactory
import cats.effect.IO
import io.circe._
import io.circe.generic.auto._
import cats.implicits._
import org.joda.time.DateTime
import Common.DBAPI._
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
import Objects.UserService.MessageEntry
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import io.circe.syntax._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Objects.UserService.FriendEntry

case class ModifyUserInfoMessagePlanner(
    userToken: String,
    userID: String,
    keys: List[String],
    values: List[String],
    override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"开始修改用户信息，用户ID为: ${userID}, keys: ${keys}, values: ${values}"))

      // Step 1: 校验输入参数的长度和一致性
      _ <- validateInputParameters(keys, values)

      // Step 2: 验证用户Token的合法性
      user <- validateUserToken(userToken, userID)

      // Step 3: 更新用户信息
      _ <- updateUserInfo(userID, keys, values)

      // Step 4: 返回操作结果
      _ <- IO(logger.info(s"用户ID: ${userID} 信息修改成功！"))
    } yield "修改成功！"
  }

  // --- Step 1: 校验输入参数的长度和一致性 ---
  private def validateInputParameters(keys: List[String], values: List[String])(using PlanContext): IO[Unit] = {
    IO {
      if (keys.isEmpty || values.isEmpty || keys.length != values.length) {
        val errorMsg = s"输入参数不一致, keys: ${keys}, values: ${values}"
        logger.error(errorMsg)
        throw new IllegalArgumentException("输入参数的keys和values长度不一致，或为空")
      }
    }
  }

  // --- Step 2: 验证用户Token的合法性 ---
  private def validateUserToken(userToken: String, userID: String)(using PlanContext): IO[User] = {
    for {
      authResultOpt <- authenticateUser(userToken, userToken) // 假设userToken也是用户名
      user <- authResultOpt match {
        case Some(authenticatedUser) if authenticatedUser.permissionLevel > 0 || authenticatedUser.userID == userID =>
          IO {
            logger.info(s"用户Token验证成功，权限Level: ${authenticatedUser.permissionLevel}")
            authenticatedUser
          }
        case Some(_) =>
          val errorMsg = "当前用户没有修改指定用户信息的权限"
          logger.error(errorMsg)
          IO.raiseError(new IllegalAccessException(errorMsg))
        case None =>
          val errorMsg = "用户Token验证失败"
          logger.error(errorMsg)
          IO.raiseError(new IllegalArgumentException(errorMsg))
      }
    } yield user
  }

  // --- Step 3: 更新用户信息 ---
  private def updateUserInfo(userID: String, keys: List[String], values: List[String])(using PlanContext): IO[Unit] = {
    val allowedFields = Set(
      "email",
      "username",
      "phone_number",
      "permission_level",
      "ban_days",
      "match_status"
    )
    val updates = keys.zip(values).filter { case (key, _) =>
      if (allowedFields.contains(key)) {
        true
      } else {
        logger.warn(s"非法字段尝试更新: ${key}")
        false
      }
    }

    if (updates.isEmpty) {
      val errorMsg = "提供的参数中无合法字段可供更新"
      logger.error(errorMsg)
      IO.raiseError(new IllegalArgumentException(errorMsg))
    } else {
      val updateFragments = updates.map { case (key, _) => s"$key = ?" }.mkString(", ")
      val updateValues = updates.map { case (_, value) => SqlParameter("String", value) }
      val sqlQuery = s"UPDATE ${schemaName}.user_table SET ${updateFragments} WHERE user_id = ?"

      for {
        _ <- IO(logger.info(s"执行更新SQL，SQL语句: ${sqlQuery}, 参数: ${updateValues.map(_.value).mkString(", ")}"))
        dbResult <- writeDB(sqlQuery, updateValues :+ SqlParameter("String", userID))
        _ <- IO {
          if (dbResult == "Operation(s) done successfully") {
            logger.info(s"用户ID: ${userID} 的信息更新成功")
          } else {
            val errorMsg = s"更新操作未成功，返回信息: ${dbResult}"
            logger.error(errorMsg)
            throw new RuntimeException(errorMsg)
          }
        }
      } yield ()
    }
  }
}