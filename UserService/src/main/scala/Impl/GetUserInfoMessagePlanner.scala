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
import cats.implicits.*
import Utils.JsonDecodingUtils.{decodeListField, decodeMessageField}

case class GetUserInfoMessagePlanner(
    userID: String,
    override val planContext: PlanContext
) extends Planner[User] {

  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[User] = {
    for {
      // Step 1: 验证userID是否存在
      _ <- IO(logger.info(s"[Step 1] 开始验证userID是否存在: ${userID}"))
      _ <- verifyUserExists(userID)
      _ <- IO(logger.info(s"[Step 1] userID验证成功，用户存在: ${userID}"))

      // Step 2: 获取用户基本信息
      _ <- IO(logger.info(s"[Step 2] 开始从UserTable查找用户的基本信息 for userID: ${userID}"))
      userInfo <- fetchUserInfo(userID)

      // Step 3: 调用AssetService获取资产信息
      _ <- IO(logger.info(s"[Step 3] 开始调用AssetService获取用户的资产状态 for userID: ${userID}"))
      stoneAmount <- fetchStoneAmount(userID)
      
      // Step 4: 调用CardService获取抽卡次数
      _ <- IO(logger.info(s"[Step 4] 开始调用CardService获取用户的抽卡次数 for userID: ${userID}"))
      drawCount <- fetchDrawCount(userID)

      // Step 5: 获取社交信息
      _ <- IO(logger.info(s"[Step 5] 开始从UserSocialTable查询用户的社交信息 for userID: ${userID}"))
      userSocial <- fetchUserSocial(userID)

      // Step 6: 获取段位信息

      _ <- IO(logger.info(s"[Step 6] 开始从UserRankTable查询用户的段位信息 for userID: ${userID}"))
      userRank <- fetchUserRank(userID)

      // Step 7: 整合信息
      _ <- IO(logger.info(s"[Step 7] 整合信息生成User对象"))
      user <- IO(combineUserInfo(userInfo, stoneAmount, drawCount, userSocial, userRank))
    } yield user
  }
  private def verifyUserExists(userID: String)(using PlanContext): IO[Unit] = {
    val sql =
      s"""
         |SELECT user_id FROM ${schemaName}.user_table WHERE user_id = ?;
      """.stripMargin
    readDBJsonOptional(sql, List(SqlParameter("String", userID))).flatMap { jsonOpt =>
      jsonOpt match {
        case Some(_) => IO.unit
        case None => IO.raiseError(new RuntimeException(s"用户不存在: ${userID}"))
      }
    }
  }

  private def fetchStoneAmount(userID: String)(using PlanContext): IO[Int] = {
    // 调用 AssetService 的 QueryAssetStatusMessage
    import APIs.AssetService.QueryAssetStatusMessage
    for {
      _ <- IO(logger.info(s"[fetchStoneAmount] 调用QueryAssetStatusMessage获取用户资产，userID: ${userID}"))
      stoneAmount <- QueryAssetStatusMessage(userID).send
      _ <- IO(logger.info(s"[fetchStoneAmount] 获取到用户资产数量: ${stoneAmount}"))
    } yield stoneAmount
  }

  private def fetchDrawCount(userID: String)(using PlanContext): IO[Int] = {
    // 调用 CardService 的 QueryCardDrawCountMessage
    import APIs.AssetService.QueryCardDrawCountMessage
    for {
      _ <- IO(logger.info(s"[fetchDrawCount] 调用QueryCardDrawCountMessage获取抽卡次数，userID: ${userID}"))
      drawCount <- QueryCardDrawCountMessage(userID, "standard").send
      _ <- IO(logger.info(s"[fetchDrawCount] 获取到用户抽卡次数: ${drawCount}"))
    } yield drawCount
  }
  private def fetchUserInfo(userID: String)(using PlanContext): IO[(String, String, String, String, String, DateTime, Int, Int, Boolean, String)] = {
    val sql =
      s"""
         |SELECT user_id, username, password_hash, email, phone_number, register_time, permission_level, ban_days, is_online, COALESCE(match_status, '') as match_status
         |FROM ${schemaName}.user_table
         |WHERE user_id = ?;
      """.stripMargin
    readDBJson(sql, List(SqlParameter("String", userID))).map { json =>
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
  private def fetchUserRank(userID: String)(using PlanContext): IO[(Int, String, Int)] = {
    val sql =
      s"""
         |SELECT credits, rank, rank_position
         |FROM ${schemaName}.user_rank_table
          |WHERE user_id = ?;
      """.stripMargin
    readDBJsonOptional(sql, List(SqlParameter("String", userID))).map { jsonOpt =>
      jsonOpt match {
        case Some(json) =>
          val credits = decodeField[Int](json, "credits")
          val rank = decodeField[String](json, "rank")
          val rankPosition = decodeField[Int](json, "rank_position")
          (credits, rank, rankPosition)
        case None =>
          // 如果没有找到用户的排名信息，返回默认值
          logger.info(s"[fetchUserRank] No rank record found for userID: ${userID}, using default values")
          (0, "", 0)
      }
    }
  } 
  private def fetchUserSocial(userID: String)(using PlanContext): IO[(List[FriendEntry], List[BlackEntry], List[MessageEntry])] = {
    val sql =
      s"""
         |SELECT friend_list, black_list, message_box
         |FROM ${schemaName}.user_social_table
         |WHERE user_id = ?;
      """.stripMargin
    readDBJsonOptional(sql, List(SqlParameter("String", userID))).map { jsonOpt =>
      jsonOpt match {
        case Some(json) =>
          val friendList = decodeListField(json, "friend_list").map(FriendEntry)
          val blackList = decodeListField(json, "black_list").map(BlackEntry)
          val messageBox = decodeMessageField(json, "message_box").map { msg =>
            MessageEntry(
              messageSource = msg("messageSource"),
              messageDestination = msg.getOrElse("messageDestination", ""), // 提供默认值以兼容旧数据
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
      stoneAmount: Int,
      drawCount: Int,
      userSocial: (List[FriendEntry], List[BlackEntry], List[MessageEntry]),
      userRank: (Int, String, Int)
  ): User = {
    val (userID, userName, passwordHash, email, phoneNumber, registerTime, permissionLevel, banDays, isOnline, matchStatus) = userInfo
    val (friendList, blackList, messageBox) = userSocial
    val (credits, rank, rankPosition) = userRank

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
      credits = credits, // 使用从UserRankTable获取的credits
      rank = rank, // 使用从UserRankTable获取的rank
      rankPosition = rankPosition, // 使用从UserRankTable获取的rankPosition
      friendList = friendList,
      blackList = blackList,
      messageBox = messageBox
    )
  }
}