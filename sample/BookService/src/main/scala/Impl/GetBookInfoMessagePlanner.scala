package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI.*
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import io.circe.Json
import org.slf4j.LoggerFactory
import io.circe.syntax.*
import org.joda.time.DateTime
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
import io.circe.*
import io.circe.generic.auto.*
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.BookService.Book

case class GetBookInfoMessagePlanner(
                                       bookIDList: List[String],
                                       override val planContext: PlanContext
                                     ) extends Planner[List[Book]] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[List[Book]] = {
    for {
      // Step 1: Log the input bookIDList
      _ <- IO(logger.info(s"[GetBookInfo] 接收到的 bookIDList 参数为：${bookIDList}"))

      // Step 2: Fetch book info from BookTable
      books <- fetchBooks(bookIDList)

      // Step 3: Log the number of books found
      _ <- IO(logger.info(s"[GetBookInfo] 查询到的图书数量为：${books.length}"))
    } yield books
  }

  private def fetchBooks(bookIDList: List[String])(using PlanContext): IO[List[Book]] = {
    for {
      // Log the size of input bookIDList
      _ <- IO(logger.info(s"[fetchBooks] 开始创建数据库查询指令以获取图书信息，bookIDList 长度为 ${bookIDList.length}"))

      // Construct the SQL query
      sqlQuery <- IO {
        s"""
           SELECT *
           FROM ${schemaName}.book_table
           WHERE book_id = ANY(?);
        """
      }
      _ <- IO(logger.info(s"[fetchBooks] SQL 查询语句为：${sqlQuery}"))

      // Convert bookIDList to SqlParameter
      parameters <- IO {
        List(SqlParameter("Array[String]", "["+bookIDList.mkString(",")+"]"))
      }
      _ <- IO(logger.info(s"[fetchBooks] 查询所使用的参数为：${parameters}"))

      // Execute the query and retrieve the result
      books <- readDBRows(sqlQuery, parameters)

      // Log the result count
      _ <- IO(logger.info(s"[fetchBooks] 成功从数据库中获取了 ${books.length} 条记录"))
    } yield books.map(decodeType[Book])
  }
}