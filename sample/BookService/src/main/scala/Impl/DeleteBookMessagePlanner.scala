package Impl


import APIs.UserService.GetUserIDByTokenMessage
import Utils.BookManagementProcess.deleteBookRecord
import Common.API.{PlanContext, Planner}
import cats.effect.IO
import org.slf4j.LoggerFactory
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
import Utils.BookManagementProcess.deleteBookRecord
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class DeleteBookMessagePlanner(
    adminToken: String,
    bookID: String,
    override val planContext: PlanContext
) extends Planner[String] {
  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: Validate Admin Role
      userID <- validateAdminRole(adminToken)

      // Step 2: Delete Book
      deleteResult <- deleteBook(bookID)

      // Step 3: Log and Return Final Result
      _ <- IO(logger.info(s"删除图书操作最终结果: $deleteResult"))
    } yield deleteResult
  }

  // 验证管理员角色
  private def validateAdminRole(token: String)(using PlanContext): IO[String] = {
    IO(logger.info(s"[Step 1] 验证管理员身份, adminToken: $token")) >>
      GetUserIDByTokenMessage(token).send.flatMap { userID =>
        if (userID.startsWith("admin"))
          IO(logger.info(s"管理员角色验证通过，用户ID: $userID")) *> IO.pure(userID)
        else
          val errorMessage = s"用户 $userID 没有管理员权限！"
          IO(logger.error(errorMessage)) *> IO.raiseError(new IllegalStateException(errorMessage))
      }
  }

  // 删除图书
  private def deleteBook(bookID: String)(using PlanContext): IO[String] = {
    IO(logger.info(s"[Step 2] 调用 deleteBookRecord 方法，尝试删除图书记录，bookID: $bookID")) >>
      deleteBookRecord(bookID).flatMap {
        case result if result == "删除成功" =>
          IO(logger.info(s"[Step 2.1] 图书删除成功，bookID: $bookID")) *> IO.pure(result)
        case error =>
          IO(logger.error(s"[Step 2.2] 图书删除失败，bookID: $bookID，错误信息: $error")) *> IO.raiseError(new Exception(error))
      }
  }
}