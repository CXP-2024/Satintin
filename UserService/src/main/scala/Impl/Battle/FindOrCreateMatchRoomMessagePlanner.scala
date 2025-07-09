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
import java.util.UUID

case class FindOrCreateMatchRoomMessagePlanner(
  userToken: String,
  matchType: String,
  override val planContext: PlanContext
) extends Planner[Json] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[Json] = {
    for {
      // Step 1: 验证用户令牌并获取用户信息
      _ <- IO(logger.info(s"[Step 1] 开始验证用户令牌: ${userToken}"))
      userInfo <- validateUserToken()
      userID = userInfo._1
      userRank = userInfo._2
      _ <- IO(logger.info(s"[Step 1] 用户令牌验证通过，用户ID: ${userID}, 段位: ${userRank.getOrElse("无段位")}"))

      // Step 2: 验证匹配类型是否有效
      _ <- IO(logger.info(s"[Step 2] 验证匹配类型: ${matchType}"))
      _ <- validateMatchType()
      _ <- IO(logger.info(s"[Step 2] 匹配类型验证通过"))

      // Step 3: 查找可用的匹配房间
      _ <- IO(logger.info(s"[Step 3] 开始查找可用的匹配房间，类型: ${matchType}"))
      existingRoomOpt <- findAvailableRoom(matchType, userRank)
      
      // Step 4: 如果没有找到可用房间，则创建新房间
      roomInfo <- existingRoomOpt match {
        case Some(roomInfo) => 
          _ <- IO(logger.info(s"[Step 4] 找到可用的匹配房间: ${roomInfo.asJson.noSpaces}"))
          // 更新房间状态为matched
          _ <- updateRoomStatus(roomInfo("room_id").as[String], "matched")
          IO.pure(roomInfo)
        case None =>
          _ <- IO(logger.info(s"[Step 4] 未找到可用的匹配房间，创建新房间"))
          createNewRoom(userID, matchType, userRank)
      }

      // Step 5: 更新用户的match_status
      _ <- IO(logger.info(s"[Step 5] 更新用户的匹配状态"))
      _ <- updateUserMatchStatus(userID, matchType)
      _ <- IO(logger.info(s"[Step 5] 用户匹配状态更新成功"))

    } yield roomInfo
  }

  private def validateUserToken()(using PlanContext): IO[(String, Option[String])] = {
    val sql = s"""
      SELECT u.user_id, a.rank
      FROM ${schemaName}.user_table u
      LEFT JOIN ${schemaName}.user_asset_table a ON u.user_id = a.user_id
      WHERE u.usertoken = ? AND u.is_online = true;
    """

    readDBJsonOptional(sql, List(SqlParameter("String", userToken))).flatMap {
      case Some(json) =>
        // 解析用户ID和段位
        val userID = decodeField[String](json, "user_id")
        val rank = if (json.hcursor.downField("rank").succeeded) {
          Some(decodeField[String](json, "rank"))
        } else {
          None
        }
        IO.pure((userID, rank))
      case None =>
        IO.raiseError(new IllegalArgumentException("无效的用户令牌或用户未登录"))
    }
  }

  private def validateMatchType()(using PlanContext): IO[Unit] = {
    // 验证匹配类型是否合法
    val validMatchTypes = Set("quick", "ranked")
    
    if (!validMatchTypes.contains(matchType)) {
      IO.raiseError(new IllegalArgumentException(s"无效的匹配类型: ${matchType}，有效值为: ${validMatchTypes.mkString(", ")}"))
    } else {
      IO.unit
    }
  }

  private def findAvailableRoom(matchType: String, userRank: Option[String])(using PlanContext): IO[Option[Json]] = {
    // 查找状态为open且匹配类型相同的房间
    // 如果是ranked模式，尽量匹配相近段位的玩家
    val baseSQL = s"""
      SELECT room_id, owner_id, match_type, owner_rank, create_time, status, expire_time
      FROM ${schemaName}.match_room_table
      WHERE status = 'open' AND match_type = ? AND expire_time > NOW()
    """
    
    val (sql, params) = if (matchType == "ranked" && userRank.isDefined) {
      // 对于ranked模式，优先匹配相同段位的房间
      (
        baseSQL + " AND owner_rank = ? ORDER BY create_time ASC LIMIT 1",
        List(SqlParameter("String", matchType), SqlParameter("String", userRank.get))
      )
    } else {
      // 对于quick模式或没有段位的用户，直接按创建时间排序
      (
        baseSQL + " ORDER BY create_time ASC LIMIT 1",
        List(SqlParameter("String", matchType))
      )
    }

    readDBJsonOptional(sql, params)
  }

  private def createNewRoom(userID: String, matchType: String, userRank: Option[String])(using PlanContext): IO[Json] = {
    val roomID = UUID.randomUUID().toString
    val createTime = new DateTime()
    // 设置过期时间为5分钟后
    val expireTime = createTime.plusMinutes(5)
    
    val sql = s"""
      INSERT INTO ${schemaName}.match_room_table 
      (room_id, owner_id, match_type, owner_rank, create_time, status, expire_time)
      VALUES (?, ?, ?, ?, ?, 'open', ?);
    """
    
    val params = List(
      SqlParameter("String", roomID),
      SqlParameter("String", userID),
      SqlParameter("String", matchType),
      SqlParameter("String", userRank.getOrElse(null)),
      SqlParameter("DateTime", createTime),
      SqlParameter("DateTime", expireTime)
    )
    
    writeDB(sql, params).map { _ =>
      Json.obj(
        "room_id" -> Json.fromString(roomID),
        "owner_id" -> Json.fromString(userID),
        "match_type" -> Json.fromString(matchType),
        "owner_rank" -> userRank.fold(Json.Null)(Json.fromString),
        "create_time" -> Json.fromString(createTime.toString),
        "status" -> Json.fromString("open"),
        "expire_time" -> Json.fromString(expireTime.toString),
        "is_new_room" -> Json.fromBoolean(true)
      )
    }
  }

  private def updateRoomStatus(roomID: String, status: String)(using PlanContext): IO[Unit] = {
    val sql = s"""
      UPDATE ${schemaName}.match_room_table
      SET status = ?
      WHERE room_id = ?;
    """

    writeDB(sql, List(
      SqlParameter("String", status),
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