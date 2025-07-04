package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.{AdminTokenValidationProcess, UserValidationProcess, AssetQueryProcess}
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.generic.auto._
import io.circe.syntax._
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class QueryAssetStatusByIDMessagePlanner(
  adminToken: String,
  userID: String,
  override val planContext: PlanContext
) extends Planner[Int] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  
  override def plan(using context: PlanContext): IO[Int] = {
    for {
      // Step 1: 验证管理员Token
      _ <- IO(logger.info("[QueryAssetStatusByIDMessagePlanner] 验证管理员Token"))
      adminAccount <- AdminTokenValidationProcess.validateAdminToken(adminToken)
      _ <- IO(logger.info(s"[QueryAssetStatusByIDMessagePlanner] 管理员Token验证成功: ${adminAccount.accountName}"))

      // Step 2: 验证用户ID是否存在
      _ <- IO(logger.info(s"[QueryAssetStatusByIDMessagePlanner] 验证用户ID: ${userID}"))
      _ <- UserValidationProcess.validateUserExists(userID)
      _ <- IO(logger.info(s"[QueryAssetStatusByIDMessagePlanner] 用户验证成功: ${userID}"))

      // Step 3: 查询用户资产状态
      _ <- IO(logger.info("[QueryAssetStatusByIDMessagePlanner] 查询用户资产状态"))
      assetAmount <- AssetQueryProcess.fetchUserAssetStatus(userID)
      _ <- IO(logger.info(s"[QueryAssetStatusByIDMessagePlanner] 资产查询成功，当前资产: ${assetAmount}"))

    } yield assetAmount
  }
}