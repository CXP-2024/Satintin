package Impl


import Objects.UserService.MessageEntry
import Objects.UserService.User
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import APIs.UserService.GetUserInfoMessage
import Utils.RoomManagementProcess.createBattleRoom
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
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
import Objects.UserService.FriendEntry
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

case class CreateBattleRoomMessagePlanner(
                                           userToken: String,
                                           override val planContext: PlanContext
                                         ) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: 验证用户Token是否合法
      _ <- IO(logger.info(s"[Step 1] 开始验证用户Token，userToken=${userToken.take(8)}... (部分隐藏)"))
      user <- validateUserToken(userToken)

      // Step 2: 获取用户ID作为房主
      userID = user.userID
      _ <- IO(logger.info(s"[Step 2] 解码Token成功，确定用户ID: ${userID}"))

      // Step 3: 调用公共方法创建对战房间
      _ <- IO(logger.info(s"[Step 3] 调用 createBattleRoom 方法，playerOneID=${userID}"))
      roomID <- createBattleRoom(userID)

      // Step 4: 返回生成的roomID作为结果
      _ <- IO(logger.info(s"[Step 4] 房间创建成功，返回房间ID: ${roomID}"))
    } yield roomID
  }

  /**
   * 验证用户Token是否合法，
   * 返回用户的信息（User对象，如果验证通过）
   */
  private def validateUserToken(userToken: String)(using PlanContext): IO[User] = {
    logger.info("调用 GetUserInfoMessage 接口验证用户Token")
    // Use userToken as userID, consistent with other services like AssetService and CardService
    GetUserInfoMessage(userToken, userToken).send.flatMap { user =>
      if (user == null) IO.raiseError(new SecurityException(s"用户Token无效或者未通过认证: userToken=${userToken}"))
      else IO {
        logger.info("用户认证成功！")
        user
      }
    }
  }
}