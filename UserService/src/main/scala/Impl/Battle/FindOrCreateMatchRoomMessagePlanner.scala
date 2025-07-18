package Impl.Battle

import APIs.UserService.FindOrCreateMatchRoomMessage
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import org.joda.time.DateTime
import org.joda.time.format.DateTimeFormat
import java.util.UUID

case class FindOrCreateMatchRoomMessagePlanner(
  userID: String,
  matchType: String,
  override val planContext: PlanContext
) extends Planner[Json] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)
  // 去除matchType两端的空格
  private val trimmedMatchType = matchType.trim()

  override def plan(using planContext: PlanContext): IO[Json] = {
    for {
      // Step 1: 验证匹配类型是否有效
      _ <- IO(logger.info(s"[Step 1] 验证匹配类型: ${trimmedMatchType}"))
      _ <- validateMatchType()
      _ <- IO(logger.info(s"[Step 1] 匹配类型验证通过"))

      // Step 2: 查找可用的匹配房间
      _ <- IO(logger.info(s"[Step 2] 开始查找可用的匹配房间，类型: ${trimmedMatchType}"))
      existingRoomOpt <- findAvailableRoom(trimmedMatchType)
      
      // Step 3: 如果没有找到可用房间，则创建新房间
      roomInfo <- existingRoomOpt match {
        case Some(roomInfo) => 
          for {
            _ <- IO(logger.info(s"[Step 3] 找到可用的匹配房间: ${roomInfo.asJson.noSpaces}"))
            // 匹配成功后删除房间
            // 根据日志分析，字段名为"roomID"
            roomId = roomInfo.hcursor.downField("roomID").as[String].getOrElse("")
            _ <- IO(logger.info(s"[Step 3] 找到的房间ID: ${roomId}"))
            _ <- deleteRoom(roomId)
            result <- IO.pure(roomInfo)
          } yield result
        case None =>
          for {
            _ <- IO(logger.info(s"[Step 3] 未找到可用的匹配房间，创建新房间"))
            newRoom <- createNewRoom(userID, trimmedMatchType)
            _ <- IO(logger.info(s"[Step 3] 创建的新房间: ${newRoom.asJson.noSpaces}"))
          } yield newRoom
      }

      // Step 4: 更新用户的match_status
      _ <- IO(logger.info(s"[Step 4] 更新用户的匹配状态"))
      _ <- updateUserMatchStatus(userID, trimmedMatchType)
      _ <- IO(logger.info(s"[Step 4] 用户匹配状态更新成功"))

      // 从日志分析，确定字段名为"roomID"
      roomId = roomInfo.hcursor.downField("roomID").as[String] match {
        case Right(id) if id.nonEmpty => 
          id
        case _ => 
          // 如果从JSON中获取失败，记录错误并返回一个新生成的ID
          val fallbackId = UUID.randomUUID().toString
          logger.error(s"[ERROR] 无法从roomInfo中获取roomID: ${roomInfo.asJson.noSpaces}，使用备用ID: ${fallbackId}")
          fallbackId
      }
      
      _ <- IO(logger.info(s"[FINAL] 返回的房间ID: ${roomId}"))
      
      // 构建返回结果，总是返回roomID
      result = Json.obj(
        "room_id" -> Json.fromString(roomId)
      )

    } yield result
  }

  private def validateMatchType()(using PlanContext): IO[Unit] = {
    // 验证匹配类型是否合法
    val validMatchTypes = Set("quick", "ranked")
    
    if (!validMatchTypes.contains(trimmedMatchType)) {
      IO.raiseError(new IllegalArgumentException(s"无效的匹配类型: ${trimmedMatchType}，有效值为: ${validMatchTypes.mkString(", ")}"))
    } else {
      IO.unit
    }
  }

  private def findAvailableRoom(matchType: String)(using PlanContext): IO[Option[Json]] = {
    // 查找状态为open且匹配类型相同的房间
    // 不考虑段位匹配
    // 使用别名确保返回的字段名一致
    val sql = s"""
      SELECT room_id as "roomID", owner_id as "ownerID", match_type as "matchType", 
             create_time as "createTime", status, expire_time as "expireTime"
      FROM ${schemaName}.match_room_table
      WHERE status = 'open' AND match_type = ? AND expire_time > NOW()
      ORDER BY create_time ASC LIMIT 1
    """
    
    readDBJsonOptional(sql, List(SqlParameter("String", matchType)))
  }

  private def createNewRoom(userID: String, matchType: String)(using PlanContext): IO[Json] = {
    val roomID = UUID.randomUUID().toString
    val createTime = new DateTime()
    // 设置过期时间为30分钟后
    val expireTime = createTime.plusMinutes(30)
    // 默认段位为0，Int类型
    val defaultRank = 0
    
    // 使用PostgreSQL兼容的时间戳格式
    val formatter = DateTimeFormat.forPattern("yyyy-MM-dd HH:mm:ss.SSS")
    val createTimeStr = formatter.print(createTime)
    val expireTimeStr = formatter.print(expireTime)
    
    val sql = s"""
      INSERT INTO ${schemaName}.match_room_table 
      (room_id, owner_id, match_type, owner_rank, create_time, status, expire_time)
      VALUES (?, ?, ?, ?, ?::timestamp, 'open', ?::timestamp);
    """
    
    val params = List(
      SqlParameter("String", roomID),
      SqlParameter("String", userID),
      SqlParameter("String", matchType),
      SqlParameter("Int", defaultRank.toString),
      SqlParameter("String", createTimeStr),
      SqlParameter("String", expireTimeStr)
    )
    
    writeDB(sql, params).map { _ =>
      // 记录日志，确保roomID被正确生成
      logger.info(s"[CreateNewRoom] 成功创建房间，ID: ${roomID}")
      
      // 确保创建的JSON对象使用与数据库返回相同的字段名
      Json.obj(
        "roomID" -> Json.fromString(roomID),
        "ownerID" -> Json.fromString(userID),
        "matchType" -> Json.fromString(matchType),
        "ownerRank" -> Json.fromInt(defaultRank),
        "createTime" -> Json.fromString(createTimeStr),
        "status" -> Json.fromString("open"),
        "expireTime" -> Json.fromString(expireTimeStr),
        "is_new_room" -> Json.fromBoolean(true)
      )
    }
  }

  private def deleteRoom(roomID: String)(using PlanContext): IO[Unit] = {
    val sql = s"""
      DELETE FROM ${schemaName}.match_room_table
      WHERE room_id = ?;
    """

    writeDB(sql, List(
      SqlParameter("String", roomID)
    )).map(_ => ())
  }

  private def updateUserMatchStatus(userID: String, matchStatus: String)(using PlanContext): IO[Unit] = {
    val sql = s"""
      UPDATE ${schemaName}.user_table
      SET match_status = ?
      WHERE user_id = ?;
    """

    writeDB(sql, List(
      SqlParameter("String", matchStatus),
      SqlParameter("String", userID)
    )).map(_ => ())
  }
}