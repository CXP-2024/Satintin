package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.AssetTransactionFacade
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.generic.auto._
import io.circe.syntax._
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class CreateAssetTransactionMessagePlanner(
  userToken: String,
  transactionType: String,
  changeAmount: Int,
  changeReason: String,
  override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
    override def plan(using context: PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"[CreateAssetTransactionMessagePlanner] 开始执行资产交易"))
      result <- AssetTransactionFacade.executeAssetTransaction(
        userToken, transactionType, changeAmount, changeReason
      )
      _ <- IO(logger.info(s"[CreateAssetTransactionMessagePlanner] ${result}"))
    } yield result
  }
}