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

// 导入需要调用的其他服务的API
import APIs.UserService.ViewUserBasicInfoMessage
import APIs.AssetService.QueryAssetStatusMessage

case class ViewUserAllInfoMessagePlanner(
    adminToken: String,
    userID: String,
    override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"=== ViewUserAllInfo开始执行 ==="))
      _ <- IO(logger.info(s"输入参数: adminToken=${adminToken}, userID='${userID}'"))
      
      // Step 1: 验证管理员权限
      adminAccount <- verifyAdminPermission()
      _ <- IO(logger.info(s"管理员验证成功: ${adminAccount.accountName}"))
      
      // Step 2: 调用UserService - 这里可能是问题所在
      _ <- IO(logger.info("=== 准备调用UserService ==="))
      _ <- IO(logger.info(s"即将调用ViewUserBasicInfoMessage，userID参数: '${userID}'"))
      
      userBasicInfoResponse <- ViewUserBasicInfoMessage(userID).send.handleErrorWith { error =>
        IO(logger.error(s"调用UserService失败: ${error.getMessage}")) *>
        IO.raiseError(error)
      }
      
      _ <- IO(logger.info(s"UserService调用成功"))
      _ <- IO(logger.info(s"UserService响应: '${userBasicInfoResponse}'"))
      _ <- IO(logger.info(s"UserService响应类型: ${userBasicInfoResponse.getClass.getSimpleName}"))
      
      // Step 3: 构建用户完整信息
      userAllInfoList <- buildUserAllInfoList(userBasicInfoResponse)
      
      // Step 4: 返回结果
      resultJson <- IO(userAllInfoList.asJson.noSpaces)
      _ <- IO(logger.info(s"最终返回: ${resultJson}"))
      
    } yield resultJson
  }

  /**
   * 验证管理员权限并返回管理员账户信息
   */
  private def verifyAdminPermission()(using PlanContext): IO[AdminAccount] = {
    if (adminToken.isEmpty) {
      IO.raiseError(new IllegalArgumentException("adminToken不能为空"))
    } else {
      val sql =
        s"""
SELECT admin_id, account_name, password_hash, create_time
FROM ${schemaName}.admin_account_table
WHERE token = ? AND is_active = true
         """.stripMargin

      readDBJsonOptional(sql, List(SqlParameter("String", adminToken))).flatMap {
        case Some(json) => 
          for {
            adminAccount <- IO(decodeType[AdminAccount](json))
            _ <- IO(logger.info(s"管理员权限验证成功: ${adminAccount.accountName}"))
          } yield adminAccount
        case None =>
          val errorMessage = s"无效的adminToken：${adminToken}"
          logger.error(errorMessage)
          IO.raiseError(new IllegalAccessException(errorMessage))
      }
    }
  }

  /**
   * 解析用户基本信息并构建完整的用户信息列表
   * 参考 ViewAllReportsMessagePlanner 的处理方式
   */
  private def buildUserAllInfoList(userBasicInfoResponse: String)(using PlanContext): IO[List[UserAllInfo]] = {
    for {
      _ <- IO(logger.info(s"=== 开始解析UserService响应 ==="))
      _ <- IO(logger.info(s"UserService返回的原始字符串: '${userBasicInfoResponse}'"))
      _ <- IO(logger.info(s"字符串长度: ${userBasicInfoResponse.length}"))
      _ <- IO(logger.info(s"是否为空字符串: ${userBasicInfoResponse.isEmpty}"))
      _ <- IO(logger.info(s"去除空格后: '${userBasicInfoResponse.trim}'"))
      
      result <- if (userBasicInfoResponse.trim.isEmpty || userBasicInfoResponse.trim == "[]") {
        IO(logger.warn("UserService返回空数组或空字符串")) *>
        IO.pure(List.empty[UserAllInfo])
      } else {
        // 解析JSON并处理每个用户
        for {
          userBasicInfoJson <- IO.fromEither(
            io.circe.parser.parse(userBasicInfoResponse)
              .left.map(error => new RuntimeException(s"解析JSON失败: ${error.getMessage}"))
          )
          
          _ <- IO(logger.info(s"成功解析JSON: ${userBasicInfoJson}"))
          
          userBasicInfoArray <- IO.fromEither(
            userBasicInfoJson.asArray
              .toRight(new RuntimeException("响应不是数组格式"))
          )
          
          _ <- IO(logger.info(s"数组包含 ${userBasicInfoArray.length} 个元素"))
          
          userAllInfoList <- userBasicInfoArray.toList.traverse { userJson =>
            buildSingleUserAllInfo(userJson)
          }
          
          _ <- IO(logger.info(s"成功构建 ${userAllInfoList.length} 个用户的完整信息"))
        } yield userAllInfoList
      }
    } yield result
  }

  /**
   * 为单个用户构建完整信息（基本信息 + 资产信息）
   */
  private def buildSingleUserAllInfo(userJson: Json)(using PlanContext): IO[UserAllInfo] = {
    for {
      // 提取用户基本信息字段
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
      
      // 调用AssetService获取用户资产信息
      stoneAmount <- QueryAssetStatusMessage(userID).send.handleErrorWith { error =>
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