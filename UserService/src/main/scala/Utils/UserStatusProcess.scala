package Utils

//process plan import 预留标志位，不要删除
import io.circe.*
import io.circe.syntax.*
import io.circe.generic.auto.*
import org.joda.time.DateTime
import Common.DBAPI.*
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import Objects.UserService.{BlackEntry, FriendEntry, MessageEntry, User}
import Common.API.{PlanContext, Planner}
import Common.Object.SqlParameter
import cats.effect.IO
import io.circe.*
import io.circe.syntax.*
import io.circe.generic.auto.*
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.UserService.MessageEntry
import Objects.UserService.User
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import Common.API.PlanContext
import Common.Object.{ParameterList, SqlParameter}

import scala.util.Properties.userName

case object UserStatusProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  def fetchUserStatus(userID: String)(using PlanContext): IO[Option[User]] = {
    logger.info(s"开始执行 fetchUserStatus 方法，参数 userID = ${userID}")
  
    if (userID.isEmpty) {
      IO(logger.error("userID 为空，无法查询用户状态！")) *>
        IO.pure(None)
    } else {
      for {
        // Step 1: 获取用户基础信息
        userBaseOpt <- {
          val sql =
            s"""
               SELECT user_id, username, password_hash, email, phone_number, register_time, 
                      permission_level, ban_days, is_online, match_status
               FROM ${schemaName}.user_table
               WHERE user_id = ?;
             """
          logger.info(s"查询用户基础信息 SQL: ${sql}")
          readDBJsonOptional(sql, List(SqlParameter("String", userID)))
            .map(_.map(decodeType[UserBaseInfo]))
        }
        _ <- IO(logger.info(s"用户基础信息查询结果为：${userBaseOpt}"))
  
        result <- userBaseOpt match {
          case None =>
            IO(logger.warn(s"userID [${userID}] 的用户未找到！")) *>
              IO.pure(None)
  
          case Some(userBase) =>
            for {
              // Step 2: 获取社交信息
              socialInfo <- {
                val socialSQL =
                  s"""
                     SELECT friend_list, black_list, message_box
                     FROM ${schemaName}.user_social_table
                     WHERE user_id = ?;
                   """
                logger.info(s"查询用户社交信息 SQL: ${socialSQL}")
                readDBJsonOptional(socialSQL, List(SqlParameter("String", userID))).map {
                  case Some(json) =>
                    (
                      decodeField[List[String]](json, "friend_list").map(FriendEntry),
                      decodeField[List[String]](json, "black_list").map(BlackEntry),
                      decodeField[List[MessageRecord]](json, "message_box").map(
                        rec => MessageEntry(rec.source, rec.destination, rec.content, rec.time)
                      )
                    )
                  case None =>
                    logger.warn(s"userID [${userID}] 的社交数据未找到，将使用空的默认值！")
                    (List.empty[FriendEntry], List.empty[BlackEntry], List.empty[MessageEntry])
                }
              }
              (friendList, blackList, messageBox) = socialInfo
  
              // Step 3: 获取资产信息
              assetInfo <- {
                val assetSQL =
                  s"""
                     SELECT stone_amount, card_draw_count, rank, rank_position
                     FROM ${schemaName}.user_asset_table
                     WHERE user_id = ?;
                   """
                logger.info(s"查询用户资产信息 SQL: ${assetSQL}")
                readDBJsonOptional(assetSQL, List(SqlParameter("String", userID))).map {
                  case Some(json) =>
                    (
                      decodeField[Int](json, "stone_amount"),
                      decodeField[Int](json, "card_draw_count"),
                      decodeField[String](json, "rank"),
                      decodeField[Int](json, "rank_position")
                    )
                  case None =>
                    logger.warn(s"userID [${userID}] 的资产数据未找到，将使用默认值 0 或空！")
                    (0, 0, "", 0)
                }
              }
              (stoneAmount, cardDrawCount, rank, rankPosition) = assetInfo
  
              // Step 4: 封装并返回 User 实例
              user = User(
                userID = userID,
                userName = userBase.userName, // 使用userBase.userName
                passwordHash = userBase.passwordHash, // 使用userBase.passwordHash
                email = userBase.email, // 使用userBase.email
                phoneNumber = userBase.phoneNumber, // 使用userBase.phoneNumber
                registerTime = userBase.registerTime, // 使用userBase.registerTime
                permissionLevel = userBase.permissionLevel, // 使用userBase.permissionLevel
                banDays = userBase.banDays, // 使用userBase.banDays
                isOnline = userBase.isOnline, // 使用userBase.isOnline
                matchStatus = userBase.matchStatus, // 使用userBase.matchStatus
                stoneAmount = stoneAmount,
                cardDrawCount = cardDrawCount,
                rank = rank,
                rankPosition = rankPosition,
                friendList = friendList,
                blackList = blackList,
                messageBox = messageBox
              )
              _ <- IO(logger.info(s"成功封装用户数据：${user}"))
            } yield Some(user)
        }
      } yield result
    }
  }
  
  // 用于解析 user 基础信息的辅助数据结构
  case class UserBaseInfo(
    userID: String,
    userName: String,
    passwordHash: String,
    email: String,
    phoneNumber: String,
    registerTime: DateTime,
    permissionLevel: Int,
    banDays: Int,
    isOnline: Boolean,
    matchStatus: String
  )
  
  // 用于解析 message_box 的辅助数据结构
  case class MessageRecord(source: String, destination: String, content: String, time: DateTime)
  
  
  def updateBanStatus(userID: String, banDays: Int)(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger("UpdateBanStatus")  // 同文后端处理: logger 统一
  
    for {
      // Step 1: Validate inputs
      _ <- IO {
        if (userID.trim.isEmpty) {
          logger.error("userID不能为空")
          throw new IllegalArgumentException("userID不能为空")
        }
        if (banDays < 0) {
          logger.error(s"banDays不能为负数: ${banDays}")
          throw new IllegalArgumentException("banDays不能为负数")
        }
      }
  
      // Step 2: Update ban_days in user_table
      updateSQL <- IO {
        s"""
  UPDATE ${schemaName}.user_table
  SET ban_days = ?
  WHERE user_id = ?
         """.stripMargin
      }
      updateParams <- IO {
        List(
          SqlParameter("Int", banDays.toString),
          SqlParameter("String", userID)
        )
      }
      _ <- IO(logger.info(s"封禁状态更新 SQL: ${updateSQL}, 参数: userID=${userID}, banDays=${banDays}"))
      updateResult <- writeDB(updateSQL, updateParams)
      _ <- IO(logger.info(s"封禁状态更新完成: ${updateResult}"))
  
      // Step 3: Insert operation log into user_operation_log_table
      logID <- IO(java.util.UUID.randomUUID().toString)
      actionType <- IO("更新封禁状态")
      actionDetail <- IO(s"将用户 ${userID} 的封禁天数更新为 ${banDays}")
      actionTime <- IO(DateTime.now())
  
      insertLogSQL <- IO {
        s"""
  INSERT INTO ${schemaName}.user_operation_log_table
  (log_id, user_id, action_type, action_detail, action_time)
  VALUES (?, ?, ?, ?, ?)
         """.stripMargin
      }
      insertLogParams <- IO {
        List(
          SqlParameter("String", logID),
          SqlParameter("String", userID),
          SqlParameter("String", actionType),
          SqlParameter("String", actionDetail),
          SqlParameter("DateTime", actionTime.getMillis.toString)
        )
      }
      _ <- IO(logger.info(
        s"记录操作日志 SQL: ${insertLogSQL}, 参数: logID=${logID}, actionType=${actionType}, actionDetail=${actionDetail}, actionTime=${actionTime}"
      ))
      logResult <- writeDB(insertLogSQL, insertLogParams)
      _ <- IO(logger.info(s"操作日志记录完成: ${logResult}"))
  
    } yield "状态更新成功！"
  }
  
  /**
   * 获取所有用户ID列表
   */
  def getAllUserIDs()(using PlanContext): IO[List[String]] = {
    val sql = s"""
      SELECT user_id 
      FROM ${schemaName}.user_table 
      ORDER BY register_time DESC
    """.stripMargin

    for {
      _ <- IO(logger.info("查询所有用户ID"))
      rows <- readDBRows(sql, List())
      _ <- IO(logger.info(s"查询到 ${rows.length} 行数据"))
      _ <- IO(logger.info(s"第一行数据示例: ${rows.headOption}"))
      
      userIDs <- IO {
        val ids = rows.map { json =>
          // 修改：使用正确的字段名 "userID" 而不是 "user_id"
          val userID = json.hcursor.downField("userID").as[String].getOrElse("")
          logger.info(s"解析用户ID: ${userID}")
          userID
        }.filter(_.nonEmpty)
        
        logger.info(s"解析出 ${ids.length} 个有效用户ID")
        if (ids.nonEmpty) {
          logger.info(s"前几个用户ID: ${ids.take(3)}")
        }
        ids
      }
      
      _ <- IO(logger.info(s"获取到 ${userIDs.length} 个用户ID"))
    } yield userIDs
  }
}
