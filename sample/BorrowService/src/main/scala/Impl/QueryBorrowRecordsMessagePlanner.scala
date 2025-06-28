package Impl


import APIs.BookService.GetBookInfoMessage
import Objects.BorrowService.BorrowRecord
import Objects.BookService.Book
import Objects.UserService.UserRole
import Objects.UserService.User
import APIs.UserService.GetUserIDByTokenMessage
import Objects.BookService.BookCategory
import Utils.BorrowManagementProcess.queryBorrowRecords
import Common.API.{PlanContext, Planner}
import Common.DBAPI.*
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import org.joda.time.DateTime
import io.circe.*
import io.circe.syntax.*
import io.circe.generic.auto.*
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import io.circe.*
import io.circe.syntax.*
import io.circe.generic.auto.*
import org.joda.time.DateTime
import cats.implicits.*
import Common.DBAPI.*
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Common.ServiceUtils.schemaName
import Utils.BorrowManagementProcess.queryBorrowRecords
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class QueryBorrowRecordsMessagePlanner(
                                             userToken: String,
                                             override val planContext: PlanContext
                                           ) extends Planner[List[Book]] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[List[Book]] = {
    for {
      // Step 1: Validate userToken and determine userID
      _ <- IO(logger.info(s"Step 1: 验证userToken有效性"))
      userID <- GetUserIDByTokenMessage(userToken).send

      // Step 2: Query borrow records based on userID
      _ <- IO(logger.info(s"Step 2: 查询借书记录"))
      borrowRecords <- queryBorrowRecords(userID)

      // Step 3: Map borrow records to a list of Book objects
      _ <- IO(logger.info(s"Step 3: 将查询结果封装为Book列表"))
      bookList <- GetBookInfoMessage(borrowRecords.map(_.bookID)).send
    } yield bookList
  }

}