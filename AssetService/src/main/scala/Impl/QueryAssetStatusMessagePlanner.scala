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
  userID: String,
  override val planContext: PlanContext
) extends Planner[Int] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  
  override def plan(using context: PlanContext): IO[Int] = {
    for {
      _ <- IO(logger.info("[QueryAssetStatusMessagePlanner] 查询用户资产状态"))
      assetAmount <- AssetStatusService.fetchAssetStatus(userID)
      _ <- IO(logger.info(s"[QueryAssetStatusMessagePlanner] 资产查询成功，当前资产: ${assetAmount}"))

    } yield assetAmount
  }
}