package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import Common.API.{PlanContext, Planner}
import Common.Object.SqlParameter
import cats.effect.IO
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.API.PlanContext
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.BookService.BookCategory
import Objects.BookService.Book
import Common.Object.ParameterList
import cats.implicits._

case object BookManagementProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  
  def deleteBookRecord(bookID: String)(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger("deleteBookRecord")  // 同文后端处理: logger 统一
  
    // Logging the start of the process
    IO(logger.info(s"开始删除图书记录, 图书ID: ${bookID}")) *>
      // Step 1: Validate input
      (if (bookID == null || bookID.trim.isEmpty) {
        IO(logger.warn("输入的bookID不合法，不能为空")) *>
        IO.pure("输入的bookID不合法")
      } else {
        // Step 2: Check if the book exists in the database
        val querySQL = s"SELECT book_id FROM ${schemaName}.book_table WHERE book_id = ?"
        val deleteSQL = s"DELETE FROM ${schemaName}.book_table WHERE book_id = ?"
        val parameters = List(SqlParameter("String", bookID))
        
        // Query for the book
        for {
          _ <- IO(logger.info(s"查询图书记录是否存在, SQL: ${querySQL}"))
          maybeBook <- readDBJsonOptional(querySQL, parameters)
          // Step 3: Handle the query result
          result <- maybeBook match {
            case Some(_) =>
              // If the book exists, proceed with deletion
              for {
                _ <- IO(logger.info(s"找到图书记录, 开始删除, 图书ID: ${bookID}, SQL: ${deleteSQL}"))
                _ <- writeDB(deleteSQL, parameters)
                _ <- IO(logger.info(s"图书记录删除成功, 图书ID: ${bookID}"))
              } yield "删除成功"
            case None =>
              IO(logger.info(s"未找到图书记录, 图书ID: ${bookID}，返回 '记录不存在' 结果")) *>
              IO.pure("记录不存在")
          }
        } yield result
      })
  }
  
  def queryBooks(titleKeyword: Option[String], category: Option[BookCategory])(using PlanContext): IO[List[Book]] = {
    logger.info(s"[queryBooks] 方法开始执行，输入参数为 titleKeyword: ${titleKeyword}, category: ${category}")
  
    for {
      // 构建查询SQL
      baseQuery <- IO(s"SELECT * FROM ${schemaName}.book_table WHERE ")
      titleFilter <- IO(titleKeyword.map(_ => "title ILIKE ?")) // 使用 ILIKE 进行不区分大小写的模糊匹配
      categoryFilter <- IO(category.map(_ => "category = ?"))
      filters <- IO(List(titleFilter, categoryFilter).flatten.mkString(" AND "))
      finalQuery <- IO(if (filters.isEmpty) baseQuery.stripSuffix(" WHERE ") else baseQuery + filters)
      _ <- IO(logger.info(s"[queryBooks] 构建的 SQL 查询语句为: ${finalQuery}"))
  
      // 构建查询参数
      titleParam <- IO(titleKeyword.map(word => SqlParameter("String", s"%${word}%")))
      categoryParam <- IO(category.map(cat => SqlParameter("String", cat.toString)))
      parameters <- IO(List(titleParam, categoryParam).flatten)
      _ <- IO(logger.info(s"[queryBooks] 构建的 SQL 查询参数: ${parameters}"))
  
      // 执行数据库查询并解析结果
      rows <- readDBRows(finalQuery, parameters)
      _ <- IO(logger.info(s"[queryBooks] 数据库返回了 ${rows.size} 条结果"))
  
      books <- IO(rows.map { json =>
        Book(
          bookID = decodeField[String](json, "book_id"),
          title = decodeField[String](json, "title"),
          author = decodeField[String](json, "author"),
          category = BookCategory.fromString(decodeField[String](json, "category")),
          totalCopies = decodeField[Int](json, "total_copies"),
          availableCopies = decodeField[Int](json, "available_copies"),
          createdAt = decodeField[DateTime](json, "created_at"),
          updatedAt = decodeField[DateTime](json, "updated_at")
        )
      })
      _ <- IO(logger.info(s"[queryBooks] 最终解析出的 Book 对象数量: ${books.size}"))
    } yield books
  }
  
  def addBookRecord(
      title: String,
      author: String,
      category: BookCategory,
      totalCopies: Int
  )(using PlanContext): IO[String] = {
  
    for {
      // Step 1: Validate input parameters
      _ <- IO {
        logger.info(s"Validating input parameters: title='${title}', author='${author}', category='${category}', totalCopies=${totalCopies}")
        
        if (title.trim.isEmpty) {
          throw new IllegalArgumentException("Title must be a non-empty string.")
        }
        if (author.trim.isEmpty) {
          throw new IllegalArgumentException("Author must be a non-empty string.")
        }
        if (!BookCategory.values.contains(category)) {
          throw new IllegalArgumentException(s"Invalid category: ${category}")
        }
        if (totalCopies <= 0) {
          throw new IllegalArgumentException("TotalCopies must be greater than 0.")
        }
      }
  
      // Step 2: Prepare the current time and book ID
      currentTime <- IO(DateTime.now())
      newBookID <- IO(java.util.UUID.randomUUID().toString)
      _ <- IO(logger.info(s"Generated new Book ID: ${newBookID}, Timestamp: ${currentTime}"))
  
      // Step 3: Construct SQL query and parameters for insertion
      insertSQL <- IO {
        s"""
           INSERT INTO ${schemaName}.book_table
           (book_id, title, author, category, total_copies, available_copies, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         """
      }
      params <- IO {
        List(
          SqlParameter("String", newBookID),
          SqlParameter("String", title.trim),
          SqlParameter("String", author.trim),
          SqlParameter("String", category.toString),
          SqlParameter("Int", totalCopies.toString),
          SqlParameter("Int", totalCopies.toString), // available_copies = total_copies initially
          SqlParameter("DateTime", currentTime.asJson.noSpaces), // created_at
          SqlParameter("DateTime", currentTime.asJson.noSpaces)  // updated_at
        )
      }
      _ <- IO(logger.info(s"Executing database insert with SQL: ${insertSQL}, Parameters: ${params.map(_.toString).mkString(", ")}"))
  
      // Step 4: Insert the new book record into the database
      _ <- writeDB(insertSQL, params)
  
      // Step 5: Return the generated book ID
      _ <- IO(logger.info(s"New book record created successfully with ID: ${newBookID}"))
    } yield newBookID
  }
  
  def updateBookRecord(
      bookID: String,
      title: Option[String],
      author: Option[String],
      category: Option[BookCategory],
      totalCopies: Option[Int]
  )(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger("updateBookRecord")  // 同文后端处理: logger 统一
  
    for {
      // Step 1: 验证 bookID 是否存在
      _ <- IO(logger.info(s"[updateBookRecord] 验证书籍ID=${bookID}是否存在"))
      checkBookExistsSQL <- IO(s"SELECT 1 FROM ${schemaName}.book_table WHERE book_id = ?")
      checkParams <- IO(List(SqlParameter("String", bookID)))
      maybeExists <- readDBJsonOptional(checkBookExistsSQL, checkParams)
      _ <- if (maybeExists.isEmpty) {
        IO(logger.error(s"[updateBookRecord] bookID=${bookID} 不存在"))
          *> IO("无效的bookID")
      } else {
        IO(logger.info(s"[updateBookRecord] bookID=${bookID} 存在，准备更新"))
      }
  
      // Step 2: 构造更新的字段和值
      _ <- IO(logger.info(s"[updateBookRecord] 构造要更新的字段和值"))
      updatedFields <- IO(
        List(
          title.map(t => ("title", "String", t)),
          author.map(a => ("author", "String", a)),
          category.map(c => ("category", "String", c.toString)),
          totalCopies.map(tc => ("total_copies", "Int", tc.toString)),
          Some("updated_at", "DateTime", DateTime.now().getMillis.toString)
        ).flatten
      )
      _ <- if (updatedFields.isEmpty) {
        IO(logger.error(s"[updateBookRecord] 没有提供任何要修改的字段"))
          *> IO("未提供任何要修改的字段")
      } else {
        IO(logger.info(s"[updateBookRecord] 要更新的字段: ${updatedFields.map(_._1).mkString(", ")}"))
      }
  
      // Step 3: 执行数据库更新
      setClause <- IO(updatedFields.map { case (field, _, _) => s"$field = ?" }.mkString(", "))
      updateSQL <- IO(s"UPDATE ${schemaName}.book_table SET ${setClause} WHERE book_id = ?")
      updateParams <- IO(
        updatedFields.map { case (_, dataType, value) => SqlParameter(dataType, value) } :+ SqlParameter("String", bookID)
      )
      dbUpdateResult <- writeDB(updateSQL, updateParams)
      _ <- IO(logger.info(s"[updateBookRecord] 更新成功, SQL执行结果: ${dbUpdateResult}"))
  
      // Step 4: 返回更新结果
    } yield "图书记录更新成功"
  }
}
