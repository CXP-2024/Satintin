package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.AssetStatusService
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.generic.auto._
import io.circe.syntax._
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class QueryAssetStatusMessagePlanner(
  userToken: String,
  override val planContext: PlanContext
) extends Planner[Int] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  
  override def plan(using context: PlanContext): IO[Int] = {
    for {
      // Step 1: 使用Utils验证用户Token
      _ <- IO(logger.info("[QueryAssetStatusMessagePlanner] 验证用户Token"))
      // validation to be completed
      userID <- IO(userToken) // 假设 userToken 已经解析为 userID
      _ <- IO(logger.info(s"[QueryAssetStatusMessagePlanner] 用户验证成功，userID=${userID}"))      // Step 2: 获取用户资产状态
      _ <- IO(logger.info("[QueryAssetStatusMessagePlanner] 查询用户资产状态"))
      assetAmount <- AssetStatusService.fetchAssetStatus(userID)
      _ <- IO(logger.info(s"[QueryAssetStatusMessagePlanner] 资产查询成功，当前资产: ${assetAmount}"))

    } yield assetAmount
  }
}