package Impl


import Objects.BookService.BookCategory
import APIs.UserService.GetUserIDByTokenMessage
import Utils.QuotaManagementProcess.checkQuota
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
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
import Utils.QuotaManagementProcess.checkQuota
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class CheckUserQuotaMessagePlanner(
    userToken: String,
    category: BookCategory,
    override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate userToken and get userID
      _ <- IO(logger.info(s"[Step 1] Validating userToken: ${userToken}"))
      userID <- validateUserToken(userToken)

      // Step 2: Check user's quota
      _ <- IO(logger.info(s"[Step 2] Checking quota for userID: ${userID}, category: ${category}"))
      quotaCheckResult <- checkUserQuota(userID, category)

      // Step 3: Log and return the result
      _ <- IO(logger.info(s"[Step 3] Final result of quota check for userID: ${userID}, category: ${category}: ${quotaCheckResult}"))
    } yield quotaCheckResult
  }

  // Sub-step 1.1: Validate userToken to get userID
  private def validateUserToken(token: String)(using PlanContext): IO[String] = {
    GetUserIDByTokenMessage(token).send.flatMap { userID =>
      if (userID.isEmpty) {
        val errorMessage = s"[Step 1.2] Invalid or expired userToken: ${token}"
        logger.error(errorMessage)
        IO.raiseError(new IllegalArgumentException(errorMessage))
      } else {
        IO(logger.info(s"[Step 1.1] Valid userToken. Retrieved userID: ${userID}")) *> IO.pure(userID)
      }
    }
  }

  // Sub-step 2: Check user's quota
  private def checkUserQuota(userID: String, category: BookCategory)(using PlanContext): IO[String] = {
    checkQuota(userID, category).flatTap { result =>
      IO(logger.info(s"[Step 2.1] Quota check result: ${result} for userID: ${userID}, category: ${category}"))
    }
  }
}