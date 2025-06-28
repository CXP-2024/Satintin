package Impl


import APIs.UserService.GetUserIDByTokenMessage
import Utils.QuotaManagementProcess.queryQuotaDetails
import Objects.QuotaService.BorrowQuota
import Objects.BookService.BookCategory
import Common.API.{PlanContext, Planner}
import org.slf4j.LoggerFactory
import io.circe.Json
import io.circe.generic.auto.*
import io.circe.syntax._
import org.joda.time.DateTime
import cats.implicits.*
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Common.ServiceUtils.schemaName
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
import Objects.BookService.BookCategory
import io.circe._
import io.circe.generic.auto._
import cats.effect.IO
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class QueryBorrowQuotaMessagePlanner(
                                           userToken: String,
                                           override val planContext: PlanContext
                                         ) extends Planner[List[BorrowQuota]] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  /** Main planning method */
  override def plan(using planContext: PlanContext): IO[List[BorrowQuota]] = {
    for {
      // Step 1: Validate userToken and retrieve userID
      userID <- validateAndGetUserID(userToken)

      // Step 2: Query quota details for the user
      quotaDetails <- fetchQuotaDetails(userID)

      // Final step: Log and return quota details
      _ <- IO(logger.info(s"成功查询用户配额详情, 用户ID: ${userID}, 配额数量: ${quotaDetails.size}"))
    } yield quotaDetails
  }

  /**
   * Step 1: Validate the userToken and retrieve userID
   * - Calls `GetUserIDByTokenMessage` API to validate the token and get userID.
   * - If the token is invalid or expired, raises permission error.
   */
  private def validateAndGetUserID(userToken: String)(using PlanContext): IO[String] = {
    GetUserIDByTokenMessage(userToken).send.attempt.flatMap {
      case Left(error) =>
        val errorMsg = s"验证 userToken 失败: ${error.getMessage}"
        IO(logger.error(errorMsg)) *> IO.raiseError(new IllegalStateException("权限认证失败"))

      case Right(userID) =>
        IO(logger.info(s"验证 userToken 成功, 对应 userID: ${userID}")) *> IO.pure(userID)
    }
  }

  /**
   * Step 2: Fetch user quota details
   * - Uses `queryQuotaDetails` to fetch user's borrowing quota details.
   * - Returns a list of `BorrowQuota` objects.
   * - Validates the result to ensure it's not empty.
   */
  private def fetchQuotaDetails(userID: String)(using PlanContext): IO[List[BorrowQuota]] = {
    queryQuotaDetails(userID).attempt.flatMap {
      case Left(error) =>
        val errorMsg = s"查询用户配额详情失败: ${error.getMessage}"
        IO(logger.error(errorMsg)) *> IO.raiseError(new IllegalStateException("查询用户配额详情失败"))

      case Right(results) =>
        if (results.isEmpty) {
          val warnMsg = s"查询结果为空, userID: ${userID}"
          IO(logger.warn(warnMsg)) *> IO.raiseError(new IllegalStateException("用户配额详情为空"))
        } else IO.pure(results)
    }
  }
}