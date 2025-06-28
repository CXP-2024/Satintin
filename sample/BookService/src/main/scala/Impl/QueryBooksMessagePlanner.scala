package Impl


import Objects.BookService.BookCategory
import APIs.BorrowService.QueryBorrowRecordsMessage
import APIs.UserService.GetUserIDByTokenMessage
import Utils.BookManagementProcess.queryBooks
import Objects.BookService.Book
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import org.slf4j.LoggerFactory
import Common.Object.SqlParameter
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
import Objects.BookService.Book
import Common.DBAPI._
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.ServiceUtils.schemaName

case class QueryBooksMessagePlanner(
  userToken: String,
  override val planContext: PlanContext
) extends Planner[List[Book]] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[List[Book]] = {
    for {
      // Step 1: Validate userToken and get userID
      _ <- IO(logger.info(s"开始验证userToken的有效性"))
      userID <- GetUserIDByTokenMessage(userToken).send

      // Step 2: Get borrowed book IDs
      _ <- IO(logger.info(s"开始获取用户[${userID}]的借书记录"))
      borrowedBookIDs <- getBorrowedBookIDs(userID,userToken)

      // Step 3: Find all books that are not borrowed by the user
      _ <- IO(logger.info(s"开始筛选用户未借阅的图书"))
      availableBooks <- findAvailableBooks(borrowedBookIDs)

      _ <- IO(logger.info(s"筛选完成，未借阅图书数量: ${availableBooks.size}"))
    } yield availableBooks
  }


  /**
   * Fetch the list of book IDs borrowed by a user
   * @param userID the ID of the user
   * @return list of borrowed book IDs
   */
  private def getBorrowedBookIDs(userID: String, userToken:String)(using PlanContext): IO[List[String]] = {
    QueryBorrowRecordsMessage(userToken).send.map { borrowedBooks =>
      val borrowedBookIDs = borrowedBooks.map(_.bookID)
      logger.info(s"用户[${userID}]已借阅图书ID列表: ${borrowedBookIDs.mkString(", ")}")
      borrowedBookIDs
    }
  }

  /**
   * Find books that are not borrowed by filtering out borrowed books from the entire catalog
   * @param borrowedBookIDs list of book IDs already borrowed by the user
   * @return list of available books not borrowed by the user
   */
  private def findAvailableBooks(borrowedBookIDs: List[String])(using PlanContext): IO[List[Book]] = {
    queryBooks(None, None).map { allBooks =>
      val availableBooks = allBooks.filterNot(book => borrowedBookIDs.contains(book.bookID))
      logger.info(s"筛选后可借阅图书数量: ${availableBooks.size}")
      availableBooks
    }
  }
}