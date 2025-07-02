package Impl

import Common.API.{PlanContext, Planner}
import APIs.UserService.{UserBasicInfo, ViewUserBasicInfoMessage}
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits._

// 导入已有的API
import APIs.UserService.GetUserInfoMessage
import Utils.UserStatusProcess

case class ViewUserBasicInfoMessagePlanner(
    userID: String,
    override val planContext: PlanContext
) extends Planner[String] { // 改为String类型

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"查询用户基本信息，userID=${userID}"))
      
      // 根据是否提供userID来决定查询单个用户还是所有用户
      userInfoList <- if (userID.nonEmpty) {
        getSingleUserBasicInfoUsingAPI(userID)
      } else {
        getAllUsersBasicInfoUsingAPI()
      }
      
      // 序列化为JSON字符串
      resultJson <- IO(userInfoList.asJson.noSpaces)
      
      _ <- IO(logger.info(s"成功查询到 ${userInfoList.length} 个用户的基本信息"))
    } yield resultJson
  }

  /**
   * 使用已有的GetUserInfoMessage API查询单个用户的基本信息
   */
  private def getSingleUserBasicInfoUsingAPI(userID: String)(using PlanContext): IO[List[UserBasicInfo]] = {
    for {
      _ <- IO(logger.info(s"使用GetUserInfoMessage API查询用户: userID=${userID}"))
      
      // 使用已有的GetUserInfoMessage API
      getUserMessage <- IO(GetUserInfoMessage(userID, userID)) // 使用userID作为token
      userOption <- getUserMessage.send.attempt.map {
        case Right(user) => Some(user)
        case Left(error) =>
          logger.warn(s"获取用户 ${userID} 信息失败: ${error.getMessage}")
          None
      }
      
      userBasicInfoList <- IO {
        userOption.map { user =>
          UserBasicInfo(
            userID = user.userID,
            username = user.userName,
            banDays = user.banDays,
            isOnline = user.isOnline
          )
        }.toList
      }
      
      _ <- IO(logger.info(s"成功转换用户基本信息: ${userBasicInfoList.headOption.map(_.username).getOrElse("未找到用户")}"))
    } yield userBasicInfoList
  }

  /**
   * 使用UserStatusProcess工具类获取所有用户的基本信息
   */
  private def getAllUsersBasicInfoUsingAPI()(using PlanContext): IO[List[UserBasicInfo]] = {
    for {
      _ <- IO(logger.info("使用UserStatusProcess获取所有用户基本信息"))
      
      // 使用UserStatusProcess的getAllUserIDs方法获取所有用户ID
      allUserIDs <- UserStatusProcess.getAllUserIDs()
      
      _ <- IO(logger.info(s"获取到 ${allUserIDs.length} 个用户ID"))
      
      // 为每个用户ID使用GetUserInfoMessage API获取详细信息
      userBasicInfoList <- allUserIDs.traverse { userId =>
        getUserBasicInfoByAPI(userId)
      }.map(_.flatten) // 过滤掉获取失败的用户
      
      _ <- IO(logger.info(s"成功获取 ${userBasicInfoList.length} 个用户的基本信息"))
    } yield userBasicInfoList
  }

  /**
   * 使用GetUserInfoMessage API获取单个用户的基本信息（内部辅助方法）
   */
  private def getUserBasicInfoByAPI(userID: String)(using PlanContext): IO[Option[UserBasicInfo]] = {
    for {
      _ <- IO(logger.debug(s"获取用户 ${userID} 的基本信息"))
      
      getUserMessage <- IO(GetUserInfoMessage(userID, userID))
      userOption <- getUserMessage.send.attempt.map {
        case Right(user) => 
          Some(UserBasicInfo(
            userID = user.userID,
            username = user.userName,
            banDays = user.banDays,
            isOnline = user.isOnline
          ))
        case Left(error) =>
          logger.debug(s"获取用户 ${userID} 信息失败，跳过: ${error.getMessage}")
          None
      }
      
    } yield userOption
  }
}