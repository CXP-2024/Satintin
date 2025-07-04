package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.{AdminTokenValidationProcess, UserValidationProcess, AssetModificationProcess, TransactionRecordProcess}
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.generic.auto._
import io.circe.syntax._
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class RewardAssetByIDMessagePlanner(
  adminToken: String,
  userID: String,
  rewardAmount: Int,
  override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  
  override def plan(using context: PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info("开始执行 RewardAssetByIDMessagePlanner"))

      // Step 1: 验证管理员权限
      _ <- IO(logger.info("[Step 1] 验证管理员权限"))
      adminAccount <- AdminTokenValidationProcess.validateAdminToken(adminToken)
      _ <- IO(logger.info(s"[Step 1] 管理员验证成功: ${adminAccount.accountName}"))

      // Step 2: 验证用户ID是否存在
      _ <- IO(logger.info(s"[Step 2] 验证用户ID: ${userID}"))
      _ <- UserValidationProcess.validateUserExists(userID)
      _ <- IO(logger.info(s"[Step 2] 用户验证成功: ${userID}"))

      // Step 3: 验证奖励金额
      _ <- IO {
        if (rewardAmount <= 0) 
          throw new IllegalArgumentException("奖励金额必须大于0")
      }
      _ <- IO(logger.info(s"[Step 3] 奖励金额验证通过: ${rewardAmount}"))

      // Step 4: 修改用户资产
      _ <- IO(logger.info("[Step 4] 修改用户资产"))
      _ <- AssetModificationProcess.modifyUserAsset(userID, rewardAmount)
      _ <- IO(logger.info("[Step 4] 资产修改完成"))

      // Step 5: 创建交易记录
      _ <- IO(logger.info("[Step 5] 创建管理员奖励交易记录"))
      transactionID <- TransactionRecordProcess.createTransactionRecord(
        userID, 
        "ADMIN_REWARD", 
        rewardAmount, 
        "管理员发放奖励"
      )
      _ <- IO(logger.info(s"[Step 5] 交易记录成功，交易ID=${transactionID}"))

      _ <- IO(logger.info("RewardAssetByIDMessagePlanner 执行完成"))
    } yield s"管理员奖励发放成功，交易ID: ${transactionID}"
  }
}