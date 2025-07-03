package Impl


import Objects.UserService.MessageEntry
import Objects.UserService.User
import Objects.UserService.BlackEntry
import Objects.UserService.FriendEntry
import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import org.joda.time.DateTime
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
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
import Objects.UserService.FriendEntry
import Objects.UserService.{BlackEntry, FriendEntry, MessageEntry, User}
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Utils.JsonDecodingUtils.{decodeListField, decodeMessageField}
import Utils.UserTokenValidator

case class GetUserInfoMessagePlanner(
    userToken: String,
    userID: String,
    override val planContext: PlanContext
) extends Planner[User] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[User] = {
    for {
      // Step 1: 验证usertoken并获取真实的userID
      _ <- IO(logger.info(s"[Step 1] 开始验证usertoken: ${userToken}"))
      actualUserID <- verifyAccessPermission()
      _ <- IO(logger.info(s"[Step 1] usertoken验证成功，实际userID: ${actualUserID}"))

      // Step 2: 使用真实的userID获取用户信息（忽略传入的userID参数）
      _ <- IO(logger.info(s"[Step 2] 开始从UserTable查找用户的基本信息 for userID: ${actualUserID}"))
      userInfo <- fetchUserInfo(actualUserID)

      // Step 3: 使用真实的userID获取资产信息
      _ <- IO(logger.info(s"[Step 3] 开始从UserAssetTable查询用户的资产状态 for userID: ${actualUserID}"))
      userAssets <- fetchUserAssets(actualUserID)

      // Step 4: 使用真实的userID获取社交信息
      _ <- IO(logger.info(s"[Step 4] 开始从UserSocialTable查询用户的社交信息 for userID: ${actualUserID}"))
      userSocial <- fetchUserSocial(actualUserID)

      // Step 5: 整合信息
      _ <- IO(logger.info(s"[Step 5] 整合信息生成User对象"))
      user <- IO(combineUserInfo(userInfo, userAssets, userSocial))
    } yield user
  }

  private def verifyAccessPermission()(using PlanContext): IO[String] = {
    // 使用UserTokenValidator验证usertoken并获取真实的userID
    UserTokenValidator.getUserIDFromToken(userToken)
  }

  private def fetchUserInfo(actualUserID: String)(using PlanContext): IO[(String, String, String, String, String, DateTime, Int, Int, Boolean, String)] = {
    val sql =
      s"""
         |SELECT user_id, username, password_hash, email, phone_number, register_time, permission_level, ban_days, is_online, COALESCE(match_status, '') as match_status
         |FROM ${schemaName}.user_table
         |WHERE user_id = ?;
      """.stripMargin
    readDBJson(sql, List(SqlParameter("String", actualUserID))).map { json =>
      (
        decodeField[String](json, "user_id"),
        decodeField[String](json, "username"),
        decodeField[String](json, "password_hash"),
        decodeField[String](json, "email"),
        decodeField[String](json, "phone_number"),
        decodeField[DateTime](json, "register_time"),
        decodeField[Int](json, "permission_level"),
        decodeField[Int](json, "ban_days"),
        decodeField[Boolean](json, "is_online"),
        decodeField[String](json, "match_status")
      )
    }
  }

  private def fetchUserAssets(actualUserID: String)(using PlanContext): IO[(Int, Int, String, Int)] = {
    val sql =
      s"""
         |SELECT stone_amount, card_draw_count, COALESCE(rank, '') as rank, COALESCE(rank_position, 0) as rank_position
         |FROM ${schemaName}.user_asset_table
         |WHERE user_id = ?;
      """.stripMargin
    readDBJsonOptional(sql, List(SqlParameter("String", actualUserID))).map { jsonOpt =>
      jsonOpt match {
        case Some(json) =>
          (
            decodeField[Int](json, "stone_amount"),
            decodeField[Int](json, "card_draw_count"),
            decodeField[String](json, "rank"),
            decodeField[Int](json, "rank_position")
          )
        case None =>
          // Return default values if no asset record exists
          logger.info(s"[fetchUserAssets] No asset record found for userID: ${userID}, using default values")
          (0, 0, "Bronze", 0) // Default values: 0 stones, 0 card draws, Bronze rank, position 0
      }
    }
  }

  private def fetchUserSocial(actualUserID: String)(using PlanContext): IO[(List[FriendEntry], List[BlackEntry], List[MessageEntry])] = {
    val sql =
      s"""
         |SELECT friend_list, black_list, message_box
         |FROM ${schemaName}.user_social_table
         |WHERE user_id = ?;
      """.stripMargin
    readDBJsonOptional(sql, List(SqlParameter("String", actualUserID))).map { jsonOpt =>
      jsonOpt match {
        case Some(json) =>
          val friendList = decodeListField(json, "friend_list").map(FriendEntry)
          val blackList = decodeListField(json, "black_list").map(BlackEntry)
          val messageBox = decodeMessageField(json, "message_box").map { msg =>
            MessageEntry(
              messageSource = msg("messageSource"),
              messageContent = msg("messageContent"),
              messageTime = DateTime.parse(msg("messageTime"))
            )
          }
          (friendList, blackList, messageBox)
        case None =>
          // Return default empty values if no social record exists
          logger.info(s"[fetchUserSocial] No social record found for userID: ${userID}, using default empty values")
          (List.empty[FriendEntry], List.empty[BlackEntry], List.empty[MessageEntry])
      }
    }
  }

  private def combineUserInfo(
      userInfo: (String, String, String, String, String, DateTime, Int, Int, Boolean, String),
      userAssets: (Int, Int, String, Int),
      userSocial: (List[FriendEntry], List[BlackEntry], List[MessageEntry])
  ): User = {
    val (userID, userName, passwordHash, email, phoneNumber, registerTime, permissionLevel, banDays, isOnline, matchStatus) = userInfo
    val (stoneAmount, cardDrawCount, rank, rankPosition) = userAssets
    val (friendList, blackList, messageBox) = userSocial

    User(
      userID = userID,
      userName = userName,
      passwordHash = passwordHash,
      email = email,
      phoneNumber = phoneNumber,
      registerTime = registerTime,
      permissionLevel = permissionLevel,
      banDays = banDays,
      isOnline = isOnline,
      matchStatus = matchStatus,
      stoneAmount = stoneAmount,
      cardDrawCount = cardDrawCount,
      rank = rank,
      rankPosition = rankPosition,
      friendList = friendList,
      blackList = blackList,
      messageBox = messageBox
    )
  }
}