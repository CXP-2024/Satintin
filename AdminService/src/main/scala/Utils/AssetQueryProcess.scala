package Utils

import Common.API.PlanContext
import Common.DBAPI._
import Common.Object.SqlParameter
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._

case object AssetQueryProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 查询用户资产状态
   */
  def fetchUserAssetStatus(userID: String)(using PlanContext): IO[Int] = {
    for {
      _ <- IO(logger.info(s"[fetchUserAssetStatus] 开始查询用户资产状态: userID=${userID}"))
      
      assetOpt <- readDBJsonOptional(
        s"SELECT stone_amount FROM assetservice.user_asset_status_table WHERE user_id = ?",
        List(SqlParameter("String", userID))
      )
      
      assetAmount <- assetOpt match {
        case Some(json) =>
          val stoneAmountResult = json.hcursor.get[Int]("stoneAmount")  
          stoneAmountResult match {
            case Right(amount) =>
              IO(logger.info(s"[fetchUserAssetStatus] 查询成功，用户原石数量: ${amount}")) >>
              IO.pure(amount)
            case Left(error) =>
              IO(logger.error(s"[fetchUserAssetStatus] 资产数据解析失败: ${error}")) >>
              IO.raiseError(new IllegalArgumentException("资产数据解析失败"))
          }
        case None =>
          IO(logger.info(s"[fetchUserAssetStatus] 用户暂无资产记录，返回默认值: 0")) >>
          IO.pure(0)
      }
    } yield assetAmount
  }
}