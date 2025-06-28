package Impl


import Common.API.{PlanContext, Planner}
import APIs.AssetService.QueryAssetStatusMessage
import APIs.AssetService.DeductAssetMessage
import APIs.UserService.GetUserInfoMessage
import Utils.CardManagementProcess.{fetchUserCardInventory, drawCards}
import Objects.CardService.{DrawResult, CardEntry}
import org.slf4j.LoggerFactory
import java.util.UUID
import org.joda.time.DateTime
import cats.effect.IO
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import io.circe.Json
import io.circe.syntax.*
import cats.implicits.*
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
import Objects.CardService.DrawResult
import Objects.CardService.CardEntry
import Utils.CardManagementProcess.fetchUserCardInventory
import Utils.CardManagementProcess.drawCards
import APIs.AssetService.DeductAssetMessage
import Objects.CardService.{DrawResult}
import Common.Object.{ParameterList, SqlParameter}
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class DrawCardMessagePlanner(
                                   userToken: String,
                                   drawCount: Int,
                                   override val planContext: PlanContext
                                 ) extends Planner[DrawResult] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[DrawResult] = {
    for {
      // Step 1: Validate user token
      _ <- IO(logger.info("[Step 1] 验证用户Token合法性"))
      isValidToken <- validateUserToken(userToken)
      _ <- if (!isValidToken) {
        IO.raiseError(new IllegalArgumentException(s"用户Token非法: ${userToken}"))
      } else IO(logger.info(s"用户Token合法: ${userToken}"))

      // Step 2: Query user's asset status
      _ <- IO(logger.info("[Step 2] 检查用户资产原石数量"))
      stoneAmount <- QueryAssetStatusMessage(userToken).send
      stoneCostPerDraw = 100
      totalCost = drawCount * stoneCostPerDraw
      _ <- if (stoneAmount < totalCost) {
        IO.raiseError(new IllegalStateException(s"原石数量不足: 当前=${stoneAmount}, 需要=${totalCost}"))
      } else IO(logger.info(s"用户原石数量充足: 当前=${stoneAmount}, 消耗=${totalCost}"))

      // Step 3: Deduct user's stone assets
      _ <- IO(logger.info("[Step 3] 扣减用户资产，扣减数量=${totalCost}"))
      _ <- DeductAssetMessage(userToken, totalCost).send.flatMap { result =>
        IO(logger.info(s"扣减资产完成: $result"))
      }
      _ <- logTransaction(userToken, totalCost)

      // Step 4: Execute card draw
      _ <- IO(logger.info("[Step 4] 执行抽卡操作，数量=${drawCount}"))
      drawResult <- drawCards(userToken, getUserIDFromToken(userToken), drawCount)

      // Step 5: Log the draw results into the CardDrawLogTable
      _ <- IO(logger.info("[Step 5] 记录抽卡日志到CardDrawLogTable"))
      _ <- logCardDrawResult(userToken, drawResult, totalCost)

      _ <- IO(logger.info(s"抽卡完成，返回结果: $drawResult"))
    } yield drawResult
  }

  // Method to validate user token
  private def validateUserToken(userToken: String)(using PlanContext): IO[Boolean] = {
    // Use GetUserInfoMessage to verify token and retrieve user info
    GetUserInfoMessage(userToken, getUserIDFromToken(userToken))
      .send
      .map(_ => true)
  }

  // Method to log card draw results
  private def logCardDrawResult(userToken: String, drawResult: DrawResult, totalCost: Int)(using PlanContext): IO[Unit] = {
    for {
      userId <- IO.pure(getUserIDFromToken(userToken))
      logInsertQuery <- IO {
        s"""
           |INSERT INTO ${schemaName}.card_draw_log_table (draw_id, user_id, card_list, draw_time, total_stone_consumed)
           |VALUES (?, ?, ?, ?, ?)
           |""".stripMargin
      }
      logParams <- IO {
        List(
          SqlParameter("String", UUID.randomUUID().toString),
          SqlParameter("String", userId),
          SqlParameter("String", drawResult.cardList.asJson.noSpaces),
          SqlParameter("DateTime", DateTime.now.getMillis.toString),
          SqlParameter("Int", totalCost.toString)
        )
      }
      _ <- writeDB(logInsertQuery, logParams)
      _ <- IO(logger.info(s"抽卡日志记录完成，用户ID: $userId"))
    } yield ()
  }

  // Log the asset transaction
  private def logTransaction(userToken: String, totalCost: Int)(using PlanContext): IO[Unit] = {
    for {
      userId <- IO.pure(getUserIDFromToken(userToken))
      transactionQuery <- IO {
        s"""
           |INSERT INTO ${schemaName}.asset_transaction_table (transaction_id, user_id, transaction_type, detail, amount, transaction_time)
           |VALUES (?, ?, 'deduction', '扣减抽卡原石', ?, ?)
           |""".stripMargin
      }
      transactionParams <- IO {
        List(
          SqlParameter("String", UUID.randomUUID().toString),
          SqlParameter("String", userId),
          SqlParameter("Int", totalCost.toString),
          SqlParameter("DateTime", DateTime.now.getMillis.toString)
        )
      }
      _ <- writeDB(transactionQuery, transactionParams)
      _ <- IO(logger.info("资产交易日志记录完成"))
    } yield ()
  }

  // Extract userID from userToken.
  // 假设在 DB 里存的是完整的 UUID，就直接返回 token 本身。
  private def getUserIDFromToken(userToken: String): String = userToken
}