package Impl

import Objects.UserService.User
import APIs.UserService.GetUserInfoMessage
import APIs.UserService.ValidateUserTokenMessage
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
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class CreateBattleRoomMessagePlanner(
                                           userToken: String,
                                           override val planContext: PlanContext
                                         ) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: 验证用户Token并获取用户ID
      _ <- IO(logger.info(s"[Step 1] 开始验证用户Token，userToken=${userToken.take(8)}... (部分隐藏)"))
      userID <- validateUserToken(userToken)
      _ <- IO(logger.info(s"[Step 1] Token验证成功，获取到用户ID: ${userID}"))

      // Step 3: 调用公共方法创建对战房间
      _ <- IO(logger.info(s"[Step 3] 调用 createBattleRoom 方法，playerOneID=${userID}"))
      roomID <- createBattleRoom(userID)

      // Step 4: 返回生成的roomID作为结果
      _ <- IO(logger.info(s"[Step 4] 房间创建成功，返回房间ID: ${roomID}"))
    } yield roomID
  }
  /**
   * 验证用户Token并获取用户ID
   */
  private def validateUserToken(userToken: String)(using PlanContext): IO[String] = {
    logger.info("调用 ValidateUserTokenMessage 接口验证用户Token并获取用户ID")
    ValidateUserTokenMessage(userToken).send.flatMap { userID =>
      if (userID == null || userID.isEmpty) {
        IO.raiseError(new SecurityException(s"用户Token无效或者未通过认证: userToken=${userToken}"))
      } else {
        IO {
          logger.info(s"用户Token认证成功，获取到用户ID: ${userID}")
          userID
        }
      }
    }
  }
}