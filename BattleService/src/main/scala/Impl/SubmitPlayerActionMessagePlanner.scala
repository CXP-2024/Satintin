package Impl

import Common.API.{PlanContext, Planner}
import Objects.AdminService.ActionType
import APIs.UserService.ValidateUserTokenMessage
import Utils.PlayerActionProcess.submitPlayerAction
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import cats.implicits.*
import Common.DBAPI.*
import Common.Object.SqlParameter
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Common.ServiceUtils.schemaName

case class SubmitPlayerActionMessagePlanner(
    userToken: String,
    roomID: String,
    actionType: String,
    targetID: Option[String],
    override val planContext: PlanContext
) extends Planner[String] {

  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  /**
   * 主Plan方法
   */  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // Step 1: 验证用户Token并获取用户ID
      _ <- IO(logger.info(s"验证用户Token是否合法, userToken=${userToken}"))
      playerID <- validateUserToken(userToken)
      _ <- IO(logger.info(s"Token验证成功，获取到用户ID: ${playerID}"))

      // Step 2: 提交玩家行动
      _ <- IO(logger.info(
        s"开始记录玩家行为：playerID=${playerID}, roomID=${roomID}, actionType=${actionType}, targetID=${targetID}"
      ))
      result <- submitPlayerActionAction(playerID, roomID, actionType, targetID)

    } yield {
      // Step 3: 返回处理结果
      logger.info(result)
      result
    }
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

  /**
   * 调用公共方法记录玩家行动
   */
  private def submitPlayerActionAction(
      playerID: String,
      roomID: String,
      actionType: String,
      targetID: Option[String]
  )(using PlanContext): IO[String] = {
    for {
      // 检查 actionType 是否是合法的中文值
      _ <- IO(logger.info(s"Checking actionType=${actionType}"))
      
      _ <- IO {
        if (!List("代表Pancake动作", "代表防御动作", "代表喷射动作").contains(actionType)) {
          val errorMessage = s"Invalid action type: actionType=${actionType}. Expected: 代表Pancake动作, 代表防御动作, or 代表喷射动作"
          logger.error(errorMessage)
          throw new IllegalArgumentException(errorMessage)
        }
      }

      // 调用公共方法完成操作 - 直接使用中文actionType
      _ <- IO(logger.info(s"Calling submitPlayerAction: playerID=${playerID}, roomID=${roomID}, actionType=${actionType}, targetID=${targetID}"))
      result <- submitPlayerAction(playerID, roomID, actionType, targetID)

    } yield result
  }

}