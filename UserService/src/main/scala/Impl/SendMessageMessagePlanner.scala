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

case class SendMessageMessagePlanner(
  userToken: String,  // 现在直接作为senderID使用
  recipientID: String,
  messageContent: String,
  override val planContext: PlanContext
) extends Planner[String] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[String] = {
    // Step 1: 直接使用userToken作为senderID
    val senderID = userToken
    
    for {
      _ <- IO(logger.info(s"使用senderID: ${senderID}"))

      // Step 2: Verify sender exists
      _ <- IO(logger.info(s"验证发送者用户: ${senderID}"))
      _ <- verifyUserExists(senderID)

      // Step 3: Verify recipient exists
      _ <- IO(logger.info(s"验证接收者用户: ${recipientID}"))
      _ <- verifyUserExists(recipientID)

      // Step 4: Create message entry
      messageTime <- IO(DateTime.now())
      _ <- IO(logger.info(s"创建消息记录: 发送者=${senderID}, 接收者=${recipientID}, 内容=${messageContent}"))

      // Step 5: Add message to sender's message_box
      _ <- IO(logger.info(s"添加消息到发送者的message_box"))
      messageEntry = MessageEntry(senderID, recipientID, messageContent, messageTime)
      _ <- addMessageToUser(senderID, messageEntry)

      // Step 6: Add message to recipient's message_box
      _ <- IO(logger.info(s"添加消息到接收者的message_box"))
      _ <- addMessageToUser(recipientID, messageEntry)

      _ <- IO(logger.info("消息发送成功"))
    } yield "消息发送成功！"
  }

  // Step 2: Verify that user exists
  private def verifyUserExists(userID: String)(using PlanContext): IO[Unit] = {
    val sql = s"SELECT user_id FROM ${schemaName}.user_table WHERE user_id = ?;"
    readDBJsonOptional(sql, List(SqlParameter("String", userID))).flatMap {
      case Some(_) => 
        IO(logger.info(s"接收者用户 ${userID} 存在"))
      case None => 
        val errorMessage = s"接收者用户不存在: ${userID}"
        IO(logger.error(errorMessage)) >> 
        IO.raiseError(new IllegalArgumentException(errorMessage))
    }
  }

  // Step 3: Add message to user's message_box
  private def addMessageToUser(userID: String, messageEntry: MessageEntry)(using PlanContext): IO[Unit] = {
    for {
      // Ensure user exists in social table
      _ <- ensureUserExistsInSocialTable(userID)
      
      // Get current message_box
      currentMessages <- getMessageBox(userID)
      
      // Add new message
      updatedMessages = currentMessages :+ messageEntry
      
      // Update database
      updateSQL <- IO(s"UPDATE ${schemaName}.user_social_table SET message_box = ?::jsonb WHERE user_id = ?")
      updateParams <- IO(
        List(
          SqlParameter("String", updatedMessages.asJson.noSpaces),
          SqlParameter("String", userID)
        )
      )
      _ <- writeDB(updateSQL, updateParams)
      _ <- IO(logger.info(s"消息已添加到用户 ${userID} 的message_box"))
    } yield ()
  }

  // Helper: Get user's current message_box
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
                    IO(logger.warn(s"解析用户 ${userID} 的message_box为MessageEntry列表失败: ${decodeError.getMessage}，返回空列表")) >>
                    IO.pure(List.empty[MessageEntry])
                }
              case Left(parseError) =>
                IO(logger.warn(s"解析用户 ${userID} 的message_box JSON失败: ${parseError.getMessage}，返回空列表")) >>
                IO.pure(List.empty[MessageEntry])
            }
          case Left(cursorError) =>
            IO(logger.warn(s"获取用户 ${userID} 的message_box字段失败: ${cursorError.getMessage}，返回空列表")) >>
            IO.pure(List.empty[MessageEntry])
        }
      case None =>
        IO(logger.info(s"用户 ${userID} 在user_social_table中不存在，返回空列表")) >>
        IO.pure(List.empty[MessageEntry])
    }
  }

  // Helper: Ensure user exists in user_social_table
  private def ensureUserExistsInSocialTable(userID: String)(using PlanContext): IO[Unit] = {
    for {
      // Check if user exists in social table
      socialResult <- readDBRows(
        s"SELECT * FROM ${schemaName}.user_social_table WHERE user_id = ?;",
        List(SqlParameter("String", userID))
      )
      _ <- if (socialResult.isEmpty) {
        // User doesn't exist in social table, create entry with proper JSON format
        for {
          _ <- IO(logger.info(s"用户${userID}在user_social_table中不存在，正在创建默认条目"))
          _ <- writeDB(
            s"""INSERT INTO ${schemaName}.user_social_table 
                (user_id, friend_list, black_list, message_box) 
                VALUES (?, ?::jsonb, ?::jsonb, ?::jsonb)""",
            List(
              SqlParameter("String", userID),
              SqlParameter("String", "[]"),
              SqlParameter("String", "[]"),
              SqlParameter("String", "[]")
            )
          )
          _ <- IO(logger.info(s"已为用户${userID}创建user_social_table条目"))
        } yield ()
      } else {
        IO(logger.info(s"用户${userID}在user_social_table中已存在"))
      }
    } yield ()
  }
}
