package Impl


import Utils.BorrowManagementProcess.{queryBorrowRecords, createRenewalRecord}
import Objects.BorrowService.BorrowRecord
import APIs.UserService.GetUserIDByTokenMessage
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import org.joda.time.DateTime
import org.slf4j.LoggerFactory
import cats.effect.IO
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
import Objects.UserService.UserRole
import Utils.BorrowManagementProcess.createRenewalRecord
import Objects.UserService.User
import APIs.UserService.GetUserIDByTokenMessage
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.ServiceUtils.schemaName

case class RenewBookMessagePlanner(
    userToken: String,
    recordID: String,
    override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: 验证用户Token并获取userID.
      userID <- validateTokenAndGetUserID(userToken)

      // Step 2: 检查借书记录是否满足续借条件
      _ <- validateBorrowRecord(userID, recordID)

      // Step 3: 更新续借信息
      newDueAt <- updateRenewalInfo(recordID)

      // Step 4: 日志记录并返回成功
      _ <- IO(logger.info(s"成功续借图书，记录ID=${recordID}，新的应还时间为: ${newDueAt}"))
    } yield "续借操作成功"
  }

  // 验证用户Token的有效性并获取 userID
  private def validateTokenAndGetUserID(userToken: String)(using PlanContext): IO[String] = {
    for {
      // 发送获取userID的请求
      userID <- GetUserIDByTokenMessage(userToken).send.flatMap {
        case userID if userID.trim.nonEmpty =>
          IO(logger.info(s"Token验证成功，获取到的UserID为：${userID}")) *> IO.pure(userID)
        case _ =>
          val errorMessage = s"Token无效，无法获取用户ID：token=${userToken}"
          IO(logger.error(errorMessage)) *> IO.raiseError(new IllegalStateException(errorMessage))
      }
    } yield userID
  }

  // 验证借书记录是否满足续借条件
  private def validateBorrowRecord(userID: String, recordID: String)(using PlanContext): IO[Unit] = {
    for {
      records <- queryBorrowRecords(userID) // 查询用户的借书记录
      _ <- records.find(_.recordID == recordID) match {
        case Some(record) =>
          // 检查是否已经归还
          if (record.returnedAt.isDefined) {
            val errorMessage = s"无法续借：记录已归还，recordID=${recordID}"
            IO(logger.error(errorMessage)) *> IO.raiseError(new IllegalStateException(errorMessage))
          }
          // 检查是否已达续借上限
          else if (record.renewalCount >= 3) {
            val errorMessage = s"无法续借：续借次数已达上限，recordID=${recordID}"
            IO(logger.error(errorMessage)) *> IO.raiseError(new IllegalStateException(errorMessage))
          } else {
            IO(logger.info(s"借书记录验证通过，允许续借，recordID=${recordID}"))
          }
        case None =>
          val errorMessage = s"无法续借：借书记录不存在，recordID=${recordID}"
          IO(logger.error(errorMessage)) *> IO.raiseError(new IllegalStateException(errorMessage))
      }
    } yield ()
  }

  // 更新记录续借信息
  private def updateRenewalInfo(recordID: String)(using PlanContext): IO[DateTime] = {
    val newDueAt = DateTime.now().plusDays(30) // 新的还书日期+30天
    for {
      result <- createRenewalRecord(recordID, newDueAt) // 更新续借记录
      _ <- if (result == "续借成功") {
        IO(logger.info(s"记录ID=${recordID}续借成功，新的应还时间：${newDueAt}"))
      } else {
        val errorMessage = s"续借失败，收到的数据库返回信息为：${result}"
        IO(logger.error(errorMessage)) *> IO.raiseError(new IllegalStateException(errorMessage))
      }
    } yield newDueAt
  }
}