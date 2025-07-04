package Impl

import Common.API.{PlanContext, Planner}
import APIs.AdminService.{ViewUserAllInfoMessage, UserAllInfo}
import Objects.AdminService.AdminAccount
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits._
import Utils.AssetQueryProcess
import Utils.AdminTokenValidationProcess

// 导入需要调用的其他服务的API
import APIs.AssetService.QueryAssetStatusByIDMessage

case class ViewUserAllInfoMessagePlanner(
    adminToken: String,
    userID: String,
    override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"=== ViewUserAllInfo开始执行 ==="))
      _ <- IO(logger.info(s"adminToken: ${adminToken.take(10)}..."))
      _ <- IO(logger.info(s"userID: ${userID}"))

      // Step 1: 验证管理员权限 - 使用Utils
      _ <- IO(logger.info("Step 1: 验证管理员权限"))
      adminAccount <- AdminTokenValidationProcess.validateAdminToken(adminToken)

      // Step 2: 根据userID参数决定查询策略
      userAllInfoList <- if (userID.trim.isEmpty) {
        for {
          _ <- IO(logger.info("Step 2: 查询所有用户的完整信息"))
          result <- getAllUsersInfo()
        } yield result
      } else {
        for {
          _ <- IO(logger.info(s"Step 2: 查询特定用户的完整信息: ${userID}"))
          singleUser <- getSingleUserInfo(userID)
        } yield List(singleUser)
      }
      
      // Step 3: 返回结果
      resultJson <- IO(userAllInfoList.asJson.noSpaces)
      _ <- IO(logger.info(s"=== ViewUserAllInfo执行完成 ==="))
      _ <- IO(logger.info(s"最终返回: ${resultJson}"))
      
    } yield resultJson
  }

  /**
   * 获取所有用户的完整信息 - 模仿UserService的实现
   */
  private def getAllUsersInfo()(using PlanContext): IO[List[UserAllInfo]] = {
    for {
      _ <- IO(logger.info("开始获取所有用户基本信息"))
      
      // 使用readDBRows获取多行数据，模仿UserService中的做法
      userRows <- readDBRows(
        s"SELECT user_id, username, ban_days, is_online FROM userservice.user_table;",
        List()
      )
      
      _ <- IO(logger.info(s"查询到 ${userRows.length} 行用户数据"))
      
      // 为每行数据构建UserAllInfo
      userAllInfoList <- userRows.traverse(buildSingleUserInfoFromJson)
      
      _ <- IO(logger.info(s"成功构建 ${userAllInfoList.length} 个用户的完整信息"))
    } yield userAllInfoList
  }

  /**
   * 获取单个用户的完整信息
   */
  private def getSingleUserInfo(userID: String)(using PlanContext): IO[UserAllInfo] = {
    for {
      _ <- IO(logger.info(s"开始获取用户 ${userID} 的基本信息"))
      
      // 查询特定用户
      userBasicInfoOpt <- readDBJsonOptional(
        s"SELECT user_id, username, ban_days, is_online FROM userservice.user_table WHERE user_id = ?;",
        List(SqlParameter("String", userID))
      )
      
      userAllInfo <- userBasicInfoOpt match {
        case Some(json) =>
          buildSingleUserInfoFromJson(json)
        case None =>
          IO.raiseError(new IllegalArgumentException(s"用户不存在: ${userID}"))
      }
      
      _ <- IO(logger.info(s"成功获取用户 ${userID} 的完整信息"))
    } yield userAllInfo
  }

  /**
   * 从JSON构建单个用户的完整信息
   */
  private def buildSingleUserInfoFromJson(userJson: Json)(using PlanContext): IO[UserAllInfo] = {
    for {
      _ <- IO(logger.info(s"处理用户JSON: ${userJson}"))
      
      userID <- IO.fromEither(
        userJson.hcursor.get[String]("userID")
          .left.map(error => new RuntimeException(s"提取userID失败: ${error.getMessage}"))
      )
      
      username <- IO.fromEither(
        userJson.hcursor.get[String]("username")
          .left.map(error => new RuntimeException(s"提取username失败: ${error.getMessage}"))
      )
      
      banDays <- IO.fromEither(
        userJson.hcursor.get[Int]("banDays")
          .left.map(error => new RuntimeException(s"提取banDays失败: ${error.getMessage}"))
      )
      
      isOnline <- IO.fromEither(
        userJson.hcursor.get[Boolean]("isOnline")
          .left.map(error => new RuntimeException(s"提取isOnline失败: ${error.getMessage}"))
      )
      
      _ <- IO(logger.info(s"获取用户 ${userID} 的资产信息"))

      // 使用本地Utils而不是远程API调用
      stoneAmount <- AssetQueryProcess.fetchUserAssetStatus(userID).handleErrorWith { error =>
        IO(logger.warn(s"获取用户 ${userID} 资产信息失败: ${error.getMessage}, 使用默认值0")) *>
          IO.pure(0)
      }
      
      // 构建完整的用户信息
      userAllInfo <- IO(UserAllInfo(
        userID = userID,
        username = username,
        banDays = banDays,
        isOnline = isOnline,
        stoneAmount = stoneAmount
      ))
      
      _ <- IO(logger.info(s"成功构建用户 ${userID} 的完整信息"))
    } yield userAllInfo
  }
}