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
import io.circe.Json
import io.circe.generic.auto.*
import io.circe.syntax.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.API.PlanContext
import cats.implicits._
import Objects.BorrowService.BorrowRecord
import java.util.UUID
import io.circe.syntax.EncoderOps
import Objects.UserService.UserRole
import Objects.UserService.User
import Common.API.PlanContext

case object BorrowManagementProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  
  def createRenewalRecord(recordID: String, newDueAt: DateTime)(using PlanContext): IO[String] = {
    // Logger
  // val logger = LoggerFactory.getLogger("createRenewalRecord")  // 同文后端处理: logger 统一
  
    // Step 1: Validate input parameters
    if (recordID == null || recordID.trim.isEmpty) {
      IO.raiseError(new IllegalArgumentException("recordID不能为空"))
    } else if (newDueAt == null) {
      IO.raiseError(new IllegalArgumentException("newDueAt不能为空"))
    } else {
      IO(logger.info(s"输入参数验证通过: recordID=${recordID}, newDueAt=${newDueAt}")) *>
      // Query BorrowRecordTable by recordID
      {
        val querySQL =
          s"SELECT * FROM ${schemaName}.borrow_record_table WHERE record_id = ?"
        val queryParams = List(SqlParameter("String", recordID))
        
        readDBJsonOptional(querySQL, queryParams).flatMap {
          case Some(recordJson) =>
            // Borrow record exists
            IO(logger.info(s"借书记录存在，准备更新: recordID=${recordID}")) >>
            {
              // Extract current renewal_count for logging purposes
              val currentRenewalCount = decodeField[Int](recordJson, "renewal_count")
              IO(logger.info(s"当前续借次数为${currentRenewalCount}，新截止日期将为${newDueAt}")) >>
              {
                // Update statement for renewal
                val updateSQL =
                  s"""
                     UPDATE ${schemaName}.borrow_record_table
                     SET due_at = ?, renewal_count = renewal_count + 1
                     WHERE record_id = ?
                   """
                val updateParams = List(
                  SqlParameter("DateTime", newDueAt.getMillis.toString),
                  SqlParameter("String", recordID)
                )
  
                // Execute the update and return final success message
                writeDB(updateSQL, updateParams).map { _ =>
                  val resultMessage = "续借成功"
                  logger.info(resultMessage)
                  resultMessage
                }
              }
            }
  
          case None =>
            // Borrow record does not exist, log error and raise exception
            val errorMessage = s"借书记录不存在: recordID=${recordID}"
            IO(logger.error(errorMessage)) >>
            IO.raiseError(new RuntimeException(errorMessage))
        }
      }
    }
  }
  
  
  def updateReturnRecord(recordID: String, returnedAt: DateTime)(using PlanContext): IO[String] = {
    for {
      // Step 1: Validate Input Parameters
      _ <- IO(logger.info(s"Validating input parameters: recordID=${recordID}, returnedAt=${returnedAt}"))
      _ <- if (recordID.isEmpty)
             IO.raiseError(new IllegalArgumentException("recordID cannot be empty"))
           else IO.unit
  
      // Step 2.1: Query BorrowRecordTable to fetch the record by recordID
      querySql <- IO(s"SELECT * FROM ${schemaName}.borrow_record_table WHERE record_id = ?")
      params <- IO(List(SqlParameter("String", recordID)))
      _ <- IO(logger.info(s"Executing query to fetch borrow record: ${querySql} with recordID=${recordID}"))
      recordOptional <- readDBJsonOptional(querySql, params)
  
      // Step 2.2: Check if the record exists
      _ <- recordOptional match {
        case None =>
          IO.raiseError(new NoSuchElementException(s"No borrow record found for recordID=${recordID}"))
        case Some(_) =>
          IO(logger.info(s"Borrow record found for recordID=${recordID}"))
      }
  
      // Step 3: Update the returnedAt field in the table
      updateSql <- IO(s"UPDATE ${schemaName}.borrow_record_table SET returned_at = ? WHERE record_id = ?")
      updateParams <- IO(
        List(
          SqlParameter("DateTime", returnedAt.getMillis.toString),
          SqlParameter("String", recordID)
        )
      )
      _ <- IO(logger.info(s"Updating returned_at field for recordID=${recordID} with returnedAt=${returnedAt}"))
      updateResult <- writeDB(updateSql, updateParams)
  
      // Log completion of update
      _ <- IO(logger.info(s"Update operation completed successfully for recordID=${recordID}, Result=${updateResult}"))
    } yield "还书操作成功"
  }
  
  def createBorrowRecord(userID: String, bookID: String, dueAt: DateTime)(using PlanContext): IO[String] = {
    for {
      // Step 1: Generate a new recordID
      recordID <- IO {
        val newRecordID = UUID.randomUUID().toString
        logger.info(s"Generated unique recordID: ${newRecordID}")
        newRecordID
      }
  
      // Step 2: Validate input parameters
      _ <- if (userID.isEmpty || bookID.isEmpty) {
        IO.raiseError(new IllegalArgumentException("userID and bookID must not be empty"))
      } else {
        IO(logger.info(s"Validated input parameters: userID=${userID}, bookID=${bookID}"))
      }
  
      _ <- if (dueAt == null) {
        IO.raiseError(new IllegalArgumentException("dueAt must be a valid DateTime object"))
      } else {
        IO(logger.info(s"Validated dueAt parameter: dueAt=${dueAt}"))
      }
  
      // Step 3: Create BorrowRecord instance
      borrowedAt <- IO {
        val now = DateTime.now
        logger.info(s"Setting borrowedAt timestamp to current datetime: ${now}")
        now
      }
  
      borrowRecord <- IO {
        val record = BorrowRecord(
          recordID = recordID,
          userID = userID,
          bookID = bookID,
          borrowedAt = borrowedAt,
          dueAt = dueAt,
          returnedAt = None,
          renewalCount = 0
        )
        logger.info(s"Created BorrowRecord instance: ${record}")
        record
      }
  
      // Step 4: Insert into BorrowRecordTable
      sql <- IO {
        s"""
        INSERT INTO ${schemaName}.borrow_record_table
        (record_id, user_id, book_id, borrowed_at, due_at, renewal_count)
        VALUES (?, ?, ?, ?, ?, ?)
        """.stripMargin
      }
  
      _ <- {
        val params = List(
          SqlParameter("String", borrowRecord.recordID),
          SqlParameter("String", borrowRecord.userID),
          SqlParameter("String", borrowRecord.bookID),
          SqlParameter("DateTime", borrowRecord.borrowedAt.asJson.noSpaces),
          SqlParameter("DateTime", borrowRecord.dueAt.asJson.noSpaces),
          SqlParameter("Int", borrowRecord.renewalCount.toString)
        )
        logger.info(s"Executing SQL to insert BorrowRecord into database: ${sql}, with parameters: ${params}")
        writeDB(sql, params)
      }
  
      // Step 5: Return recordID
      _ <- IO(logger.info(s"BorrowRecord created successfully with recordID: ${recordID}"))
    } yield recordID
  }
  
  def queryBorrowRecords(userID: String)(using PlanContext): IO[List[BorrowRecord]] = {
  // val logger = LoggerFactory.getLogger(getClass)  // 同文后端处理: logger 统一
  

    for {
      borrowRecords <- {
        val sql = s"SELECT * FROM ${schemaName}.borrow_record_table WHERE user_id = ?"
        val parameters = List(SqlParameter("String", userID))
        logger.info(s"查询借书记录的SQL为：$sql，参数为：${parameters}")
        
        readDBRows(sql, parameters)
      }
  
      borrowRecordList <- {
        logger.info(s"开始将查询的记录映射为BorrowRecord对象，共计 ${borrowRecords.size} 条记录")
        
        IO {
          borrowRecords.map { recordJson =>
            decodeType[BorrowRecord](recordJson)
          }.filter(_.returnedAt.isEmpty)
        }
      }
  
      _ <- IO(logger.info(s"映射完成，共返回 ${borrowRecordList.size} 条 BorrowRecord 记录"))
    } yield borrowRecordList
  }
}
