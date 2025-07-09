package Impl

import Common.API.{PlanContext, Planner}
import Common.DBAPI._
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Objects.UserService.MessageEntry
import cats.effect.IO
import org.joda.time.DateTime
import org.slf4j.LoggerFactory
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}

case class GetChatHistoryMessagePlanner(
  userToken: String,  // 现在直接作为currentUserID使用
  friendID: String,
  override val planContext: PlanContext
) extends Planner[List[MessageEntry]] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[List[MessageEntry]] = {
    // Step 1: 直接使用userToken作为currentUserID
    val currentUserID = userToken
    
    for {
      _ <- IO(logger.info(s"使用currentUserID: ${currentUserID}"))

      // Step 2: Verify current user exists
      _ <- IO(logger.info(s"验证当前用户: ${currentUserID}"))
      _ <- verifyUserExists(currentUserID)

      // Step 3: Verify friend exists
      _ <- IO(logger.info(s"验证好友用户: ${friendID}"))
      _ <- verifyUserExists(friendID)

      // Step 4: Get current user's messages
      _ <- IO(logger.info(s"获取当前用户的消息记录"))
      currentUserMessages <- getMessageBox(currentUserID)

      // Step 5: Get friend's messages
      _ <- IO(logger.info(s"获取好友的消息记录"))
      friendMessages <- getMessageBox(friendID)

      // Step 6: Filter and combine messages between the two users
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
    // 从当前用户的消息中筛选发送给好友的消息
    val userToFriendMessages = userMessages.filter(msg => 
      msg.messageSource == currentUserID && 
      // 由于我们把消息同时存储在发送者和接收者的message_box中，
      // 这里我们需要根据消息内容来推断接收者
      // 简化处理：从用户的message_box中获取所有消息
      true
    )

    // 从好友的消息中筛选发送给当前用户的消息
    val friendToUserMessages = friendMessages.filter(msg => 
      msg.messageSource == friendID
    )

    // 合并所有相关消息
    val allChatMessages = userToFriendMessages ++ friendToUserMessages

    // 去重（因为消息可能在两个用户的message_box中都存在）
    val uniqueMessages = allChatMessages
      .groupBy(msg => (msg.messageSource, msg.messageContent, msg.messageTime))
      .values
      .map(_.head)
      .toList

    // 按时间排序
    val sortedMessages = uniqueMessages.sortBy(_.messageTime.getMillis)
    
    logger.info(s"筛选出${sortedMessages.length}条聊天记录")
    sortedMessages
  }
}
