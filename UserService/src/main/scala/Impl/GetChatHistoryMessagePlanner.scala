package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Objects.UserService.MessageEntry
import Utils.UserTokenValidator.getUserIDFromToken
import cats.effect.IO
import org.joda.time.DateTime
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class GetChatHistoryMessagePlanner(
  userToken: String,  // 用户的认证令牌，用于验证当前用户身份
  friendID: String,   // 对话好友的用户ID
  override val planContext: PlanContext
) extends Planner[List[MessageEntry]] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[List[MessageEntry]] = {
    for {
      // Step 1: 验证userToken并获取真实的当前用户ID
      _ <- IO(logger.info(s"开始验证用户的userToken并获取userID"))
      currentUserID <- getUserIDFromToken(userToken)
      _ <- IO(logger.info(s"userToken验证成功，当前用户ID=${currentUserID}"))

      // Step 2: Verify friend exists
      _ <- IO(logger.info(s"验证好友用户: ${friendID}"))
      _ <- verifyUserExists(friendID)

      // Step 3: Get current user's messages
      _ <- IO(logger.info(s"获取当前用户的消息记录"))
      currentUserMessages <- getMessageBox(currentUserID)

      // Step 4: Get friend's messages
      _ <- IO(logger.info(s"获取好友的消息记录"))
      friendMessages <- getMessageBox(friendID)

      // Step 5: Filter and combine messages between the two users
      _ <- IO(logger.info("筛选并合并两用户之间的聊天记录"))
      chatHistory <- IO {
        filterChatMessages(currentUserMessages, friendMessages, currentUserID, friendID)
      }

      _ <- IO(logger.info(s"聊天历史记录获取完成，共找到${chatHistory.length}条消息"))
    } yield chatHistory
  }

  // Step 2: Verify that user exists
  private def verifyUserExists(userID: String)(using PlanContext): IO[Unit] = {
    val sql = s"SELECT user_id FROM ${schemaName}.user_table WHERE user_id = ?;"
    readDBJsonOptional(sql, List(SqlParameter("String", userID))).flatMap {
      case Some(_) => 
        IO(logger.info(s"用户 ${userID} 存在"))
      case None => 
        val errorMessage = s"用户不存在: ${userID}"
        IO(logger.error(errorMessage)) >> 
        IO.raiseError(new IllegalArgumentException(errorMessage))
    }
  }

  // Step 3: Get user's message_box
  private def getMessageBox(userID: String)(using PlanContext): IO[List[MessageEntry]] = {
    val sql = s"SELECT message_box FROM ${schemaName}.user_social_table WHERE user_id = ?;"
    readDBJsonOptional(sql, List(SqlParameter("String", userID))).flatMap {
      case Some(json) =>
        // 尝试两种字段名：messageBox (驼峰) 和 message_box (下划线)
        val messageBoxResult = json.hcursor.get[String]("messageBox") match {
          case Right(value) => Right(value)
          case Left(_) => json.hcursor.get[String]("message_box")
        }
        
        messageBoxResult match {
          case Right(messageBoxStr) =>
            // 尝试解析JSON字符串为MessageEntry列表
            parser.parse(messageBoxStr) match {
              case Right(parsedJson) =>
                parsedJson.as[List[MessageEntry]] match {
                  case Right(messages) =>
                    IO(logger.info(s"成功解析用户 ${userID} 的${messages.length}条消息")) >>
                    IO.pure(messages)
                  case Left(decodeError) =>
                    IO(logger.warn(s"解析用户 ${userID} 的message_box为MessageEntry列表失败: ${decodeError.getMessage}")) >>
                    IO.pure(List.empty[MessageEntry])
                }
              case Left(parseError) =>
                IO(logger.warn(s"解析用户 ${userID} 的message_box JSON失败: ${parseError.getMessage}")) >>
                IO.pure(List.empty[MessageEntry])
            }
          case Left(cursorError) =>
            IO(logger.warn(s"获取用户 ${userID} 的message_box字段失败: ${cursorError.getMessage}")) >>
            IO.pure(List.empty[MessageEntry])
        }
      case None =>
        IO(logger.info(s"用户 ${userID} 在user_social_table中不存在，返回空消息列表")) >>
        IO.pure(List.empty[MessageEntry])
    }
  }

  // Step 4: Filter messages between two specific users and sort by time
  private def filterChatMessages(
    userMessages: List[MessageEntry],
    friendMessages: List[MessageEntry],
    currentUserID: String,
    friendID: String
  ): List[MessageEntry] = {
    // 从当前用户的消息中筛选与好友的对话（发送给好友的消息）
    val userToFriendMessages = userMessages.filter(msg => 
      msg.messageSource == currentUserID && msg.messageDestination == friendID
    )

    // 从好友的消息中筛选与当前用户的对话（好友发送给当前用户的消息）
    val friendToUserMessages = friendMessages.filter(msg => 
      msg.messageSource == friendID && msg.messageDestination == currentUserID
    )

    // 合并所有相关消息
    val allChatMessages = userToFriendMessages ++ friendToUserMessages

    // 去重（因为消息可能在两个用户的message_box中都存在）
    val uniqueMessages = allChatMessages
      .groupBy(msg => (msg.messageSource, msg.messageDestination, msg.messageContent, msg.messageTime))
      .values
      .map(_.head)
      .toList

    // 按时间排序
    val sortedMessages = uniqueMessages.sortBy(_.messageTime.getMillis)
    
    logger.info(s"筛选出${sortedMessages.length}条聊天记录")
    sortedMessages
  }
}
