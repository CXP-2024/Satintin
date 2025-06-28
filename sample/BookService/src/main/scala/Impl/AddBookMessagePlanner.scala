package Impl


// Planner for AddBookMessage: 添加图书记录
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Objects.BookService.BookCategory
import Objects.UserService.UserRole
import Utils.BookManagementProcess.addBookRecord
import APIs.UserService.GetUserIDByTokenMessage
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits._
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
import APIs.UserService.GetUserIDByTokenMessage
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class AddBookMessagePlanner(
    adminToken: String,
    title: String,
    author: String,
    category: BookCategory,
    totalCopies: Int,
    override val planContext: PlanContext
) extends Planner[String] {
  // Logger initialization for traceability and debugging
  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  // Main plan logic
  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: Validate adminToken and check Admin role
      _ <- IO(logger.info(s"[Step 1] Validating adminToken and user role for token: ${adminToken}"))
      userID <-  GetUserIDByTokenMessage(adminToken).send

      // Step 2: Add the book record and fetch the generated bookID
      _ <- IO(logger.info(s"[Step 2] Adding book record for title: '${title}', author: '${author}', category: '${category}', totalCopies: ${totalCopies}"))
      bookID <- addBookRecord(title, author, category, totalCopies)

      // Step 3: Log successful addition of book
      _ <- IO(logger.info(s"[Step 3] Successfully added book with ID: ${bookID}"))
    } yield bookID
  }

  /**
    * Check if the specified userID corresponds to an Admin role.
    * @param userID The User ID to be checked.
    * @return IO[Boolean] Returns a boolean indicating if the user is an Admin.
    */
  private def checkAdminRole(userID: String)(using PlanContext): IO[Boolean] = {
    val sql =
      s"""
         SELECT user_role
         FROM ${schemaName}.user_table
         WHERE user_id = ?
       """
    val parameters = List(SqlParameter("String", userID))

    for {
      userRoleStr <- readDBString(sql, parameters)
      userRole <- IO(UserRole.fromString(userRoleStr)) // Parse the role from string
      _ <- IO(logger.info(s"[CheckAdminRole] User role for userID: ${userID} is ${userRole}"))
    } yield userRole == UserRole.Admin
  }
}