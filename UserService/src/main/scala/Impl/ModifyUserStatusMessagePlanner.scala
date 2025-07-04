package Impl


import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.UserStatusProcess.updateBanStatus
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe.Json
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import org.joda.time.DateTime
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*

case class ModifyUserStatusMessagePlanner(
    userID: String,
    banDays: Int,
    override val planContext: PlanContext
) extends Planner[String] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    for {
      // 更新用户封禁状态
      _ <- IO(logger.info(s"调用 updateBanStatus 更新用户 ${userID} 的封禁天数为 ${banDays}"))
      updateResult <- updateBanStatus(userID, banDays)
      _ <- IO(logger.info(s"updateBanStatus 更新结果: ${updateResult}"))

    } yield "用户状态修改成功！"
  }
}