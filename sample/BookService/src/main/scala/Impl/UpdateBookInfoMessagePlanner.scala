package Impl


import Objects.BookService.BookCategory
import Utils.BookManagementProcess.updateBookRecord
import APIs.UserService.GetUserIDByTokenMessage
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import Common.Object.SqlParameter
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
import APIs.UserService.GetUserIDByTokenMessage
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class UpdateBookInfoMessage(
  adminToken: String,
  bookID: String,
  title: Option[String],
  author: Option[String],
  category: Option[BookCategory],
  totalCopies: Option[Int]
) extends Planner[String] {
  override def plan(using planContext: PlanContext): IO[String] =
    UpdateBookInfoMessagePlanner(
      adminToken,
      bookID,
      title,
      author,
      category,
      totalCopies
    ).plan
}

case class UpdateBookInfoMessagePlanner(
  adminToken: String,
  bookID: String,
  title: Option[String],
  author: Option[String],
  category: Option[BookCategory],
  totalCopies: Option[Int]
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: 验证管理员的权限
      _ <- IO(logger.info(s"[Step 1] 验证管理员权限，adminToken=$adminToken"))
      userID <- validateAdminToken(adminToken)
      _ <- IO(logger.info(s"[Step 1] 权限验证通过，获取管理员UserID=${userID}"))

      // Step 2: 更新书籍记录
      _ <- IO(logger.info(s"[Step 2] 准备更新书籍记录，bookID=$bookID"))
      updateResult <- updateBookRecord(bookID, title, author, category, totalCopies)
      _ <- IO(logger.info(s"[Step 2] 书籍更新结果：$updateResult"))
    } yield updateResult
  }

  // 子函数：验证管理员权限
  private def validateAdminToken(adminToken: String)(using PlanContext): IO[String] = {
    for {
      _ <- IO(logger.info(s"[validateAdminToken] 根据token验证管理员用户权限"))
      userID <- GetUserIDByTokenMessage(adminToken).send
      _ <- IO(logger.info(s"[validateAdminToken] 通过Token获取的UserID=$userID"))
      // 检查用户是否是管理员
      isAdmin <- checkUserIsAdmin(userID)
      _ <- if (!isAdmin) {
        IO(logger.error(s"[validateAdminToken] 用户${userID}无管理员权限"))
          *> IO.raiseError(new Exception("权限验证失败，用户无管理员权限"))
      } else {
        IO(logger.info(s"[validateAdminToken] 用户${userID}拥有管理员权限"))
      }
    } yield userID
  }

  // 子函数：检查用户是否为管理员
  private def checkUserIsAdmin(userID: String)(using PlanContext): IO[Boolean] = {
    val sql = s"SELECT is_admin FROM ${schemaName}.user_table WHERE user_id = ?"
    val params = List(SqlParameter("String", userID))
    readDBBoolean(sql, params)
  }
}