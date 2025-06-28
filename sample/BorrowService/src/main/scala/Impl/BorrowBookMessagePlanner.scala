package Impl


import APIs.UserService.GetUserIDByTokenMessage
import Utils.BorrowManagementProcess.{createBorrowRecord, queryBorrowRecords}
import Objects.BorrowService.BorrowRecord
import Common.API.{PlanContext, Planner}
import Common.Object.SqlParameter
import org.joda.time.DateTime
import org.slf4j.LoggerFactory
import cats.effect.IO
import io.circe.generic.auto.*
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
import Utils.BorrowManagementProcess.queryBorrowRecords
import Utils.BorrowManagementProcess.createBorrowRecord
import Objects.UserService.UserRole
import Objects.UserService.User
import APIs.UserService.GetUserIDByTokenMessage
import Common.DBAPI._
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.ServiceUtils.schemaName

case class BorrowBookMessagePlanner(
                                     userToken: String,
                                     bookID: String,
                                     override val planContext: PlanContext
                                   ) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using PlanContext): IO[String] = {
    for {
      // Step 1: 验证用户Token并获取userID
      _ <- IO(logger.info(s"[Step 1] 开始验证用户Token，Token值: ${userToken}"))
      userID <- getUserIDByToken()

      // Step 2: 检查是否已经借出该图书
      _ <- IO(logger.info("[Step 2] 检查指定图书是否已被借出"))
      _ <- validateBookAvailability(userID)

      // Step 3: 创建借阅记录
      _ <- IO(logger.info("[Step 3] 记录借书信息"))
      result <- recordBorrowInfo(userID)
    } yield result
  }

  // 验证用户Token并通过接口获取userID
  private def getUserIDByToken()(using PlanContext): IO[String] = {
    for {
      userID <- GetUserIDByTokenMessage(userToken).send
      _ <- IO(logger.info(s"[Step 1.1] 获取到的userID: ${userID}"))
    } yield userID
  }

  // 校验图书是否已被借出
  private def validateBookAvailability(userID: String)(using PlanContext): IO[Unit] = {
    for {
      // 查询用户的借书记录
      borrowRecords <- queryBorrowRecords(userID)
      _ <- IO(logger.info(s"[Step 2.1] 用户ID[${userID}]的借书记录共计 ${borrowRecords.length} 条"))

      // 检查是否存在未归还的借书记录
      isBookAlreadyBorrowed <- IO {
        borrowRecords.exists(record =>
          record.bookID == bookID && record.returnedAt.isEmpty
        )
      }
      _ <- if (isBookAlreadyBorrowed) {
        IO.raiseError(new IllegalStateException(s"[Error] 图书ID[${bookID}]已被借出，操作终止"))
      } else {
        IO(logger.info(s"[Step 2.2] 图书ID[${bookID}]未被借出，可以继续操作"))
      }
    } yield ()
  }

  // 创建借书记录
  private def recordBorrowInfo(userID: String)(using PlanContext): IO[String] = {
    val defaultBorrowPeriod = 14 // 默认借书时长为14天
    val dueAt = DateTime.now.plusDays(defaultBorrowPeriod)

    for {
      recordID <- createBorrowRecord(userID, bookID, dueAt)
      _ <- IO(logger.info(s"[Step 3.1] 成功记录借书信息，生成的借阅记录ID: ${recordID}"))
    } yield "借书成功"
  }
}