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

case class ReceiveMessagesMessagePlanner(
                                          userToken: String,
                                          override val planContext: PlanContext
                                        ) extends Planner[List[MessageEntry]] {
  val logger = LoggerFactory.getLogger(this.getClass.getSimpleName + "_" + planContext.traceID.id)

  override def plan(using planContext: PlanContext): IO[List[MessageEntry]] = {
    for {
      // Step 1: Validate userToken and retrieve userID
      _ <- IO(logger.info(s"验证userToken: ${userToken}是否有效"))
      userID <- getUserIDFromToken()

      // Step 2: Retrieve message records from UserSocialTable
      _ <- IO(logger.info(s"根据userID: ${userID}从UserSocialTable的message_box字段中获取用户的消息记录"))
      messages <- getMessageBox(userID)

      // Step 3: Categorize, sort, and map the messages to List[MessageEntry]
      _ <- IO(logger.info("整理、分类并按时间顺序排序用户的消息记录"))
      messageEntries <- IO { parseAndSortMessages(messages) }

      _ <- IO(logger.info(s"消息记录整理完成，共找到${messageEntries.length}条消息"))
    } yield messageEntries
  }

  // Step 1: Validate userToken and retrieve userID
  private def getUserIDFromToken()(using PlanContext): IO[String] = {
    val sql =
      s"""
        SELECT user_id
        FROM ${schemaName}.user_auth_table
        WHERE user_token = ?;
      """
    readDBString(
      sql,
      List(SqlParameter("String", userToken))
    ).map { userID =>
      logger.info(s"userToken验证成功，获取到用户ID: ${userID}")
      userID
    }
  }

  // Step 2: Retrieve message records from UserSocialTable
  private def getMessageBox(userID: String)(using PlanContext): IO[List[String]] = {
    val sql =
      s"""
        SELECT message_box
        FROM ${schemaName}.user_social_table
        WHERE user_id = ?;
      """
    readDBJson(
      sql,
      List(SqlParameter("String", userID))
    ).map { json =>
      val messageBox = decodeField[List[String]](json, "message_box")
      logger.info(s"从数据库成功获取到${messageBox.length}条消息记录")
      messageBox
    }
  }

  // Step 3: Categorize, sort, and map the messages to List[MessageEntry]
  private def parseAndSortMessages(messages: List[String]): List[MessageEntry] = {
    val parsedMessages = messages.map { messageStr =>
      decodeType[MessageEntry](messageStr)
    }

    val sortedMessages = parsedMessages.sortBy(_.messageTime.getMillis)
    logger.info("消息记录排序成功")
    sortedMessages
  }
}