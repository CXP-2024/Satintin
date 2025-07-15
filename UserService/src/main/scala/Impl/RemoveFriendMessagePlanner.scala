package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.FriendManagementProcess.removeFriendEntry
import Utils.UserTokenValidator.getUserIDFromToken
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.UserService.User

case class RemoveFriendMessagePlanner(
    userToken: String,
    friendID: String,
    override val planContext: PlanContext
) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: 验证userToken并获取真实的userID
      _ <- IO(logger.info(s"开始验证userToken并获取userID"))
      userID <- getUserIDFromToken(userToken)
      _ <- IO(logger.info(s"userToken验证成功，用户ID=${userID}"))

      // Step 2: 调用 removeFriendEntry 方法移除好友
      _ <- IO(logger.info(s"调用 removeFriendEntry 移除好友 friendID '${friendID}'"))
      operationResult <- removeFriendEntry(userID, friendID)

      // Step 3: 根据操作结果生成响应
      response <- operationResult match {
        case Some(successMessage) =>
          IO(logger.info(s"移除好友成功: ${successMessage}")) *> IO("好友已移除！")
        case None =>
          IO(logger.error(s"移除好友失败，找不到对应的记录")) *> IO.raiseError(new RuntimeException("好友移除失败"))
      }
    } yield response
  }

}