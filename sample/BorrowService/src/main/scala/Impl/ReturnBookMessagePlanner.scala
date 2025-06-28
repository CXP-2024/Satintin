package Impl


import Objects.BookService.BookCategory
import Objects.BookService.Book
import APIs.UserService.GetUserIDByTokenMessage
import Utils.BorrowManagementProcess.updateReturnRecord
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.ParameterList
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import org.joda.time.DateTime
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
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
import Utils.BorrowManagementProcess.updateReturnRecord
import Objects.BookService.{Book, BookCategory}
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class ReturnBookMessagePlanner(
                                     userToken: String,
                                     bookID: String,
                                     override val planContext: PlanContext
                                   ) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: Validate userToken and get userID
      userID <- validateUserToken(userToken)

      // Step 2: Find the borrow record
      recordID <- findBorrowRecord(userID, bookID)

      // Step 3: Update return record
      _ <- updateReturnStatus(recordID)

      _ <- IO(logger.info("还书操作成功"))
    } yield "还书成功"
  }

  // Step 1: Validate userToken and get userID
  private def validateUserToken(userToken: String)(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"验证用户凭据: userToken=${userToken}"))
      userID <- GetUserIDByTokenMessage(userToken).send.handleErrorWith { e =>
        IO(logger.error(s"Token验证失败: userToken=${userToken}, 错误信息=${e.getMessage}")) *> 
        IO.raiseError(new IllegalArgumentException("用户验证失败，Token无效或过期"))
      }
      _ <- IO(logger.info(s"用户验证成功: userID=${userID}"))
    } yield userID
  }

  // Step 2: Find borrow record
  private def findBorrowRecord(userID: String, bookID: String)(using PlanContext): IO[String] = {
    val sql =
      s"""
         SELECT record_id
         FROM ${schemaName}.borrow_record_table
         WHERE book_id = ? AND user_id = ? AND returned_at IS NULL;
      """
    val params = List(
      SqlParameter("String", bookID),
      SqlParameter("String", userID)
    )

    for {
      _ <- IO(logger.info(s"查找借书记录: bookID=${bookID}, userID=${userID}"))
      recordJsonOption <- readDBJsonOptional(sql, params)
      recordID <- recordJsonOption match {
        case Some(json) =>
          IO(decodeField[String](json, "record_id"))
        case None =>
          IO(logger.error(s"未找到未归还的借阅记录: bookID=${bookID}, userID=${userID}")) *>
            IO.raiseError(new IllegalStateException("没有找到对应的借阅记录"))
      }
      _ <- IO(logger.info(s"找到借书记录: recordID=${recordID}"))
    } yield recordID
  }

  // Step 3: Update return status
  private def updateReturnStatus(recordID: String)(using PlanContext): IO[Unit] = {
    val returnedAt = DateTime.now()
    for {
      _ <- IO(logger.info(s"开始更新借阅记录的还书时间: recordID=${recordID}, returnedAt=${returnedAt}"))
      _ <- updateReturnRecord(recordID, returnedAt).handleErrorWith { e =>
        IO(logger.error(s"更新借阅记录失败: recordID=${recordID}, 错误信息=${e.getMessage}")) *>
        IO.raiseError(new IllegalStateException("更新还书记录信息失败"))
      }
      _ <- IO(logger.info(s"借阅记录更新成功: recordID=${recordID}"))
    } yield ()
  }
}