package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import Common.API.{PlanContext, Planner}
import Common.Object.SqlParameter
import cats.effect.IO
import cats.implicits._
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import cats.implicits.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Common.API.PlanContext
import Common.Object.ParameterList
import io.circe.Json

case object FriendManagementProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  
  def addFriendEntry(userID: String, friendID: String)(using PlanContext): IO[String] = {
    for {
      // Step 0: 打印日志表示开始操作
      _ <- IO(logger.info(s"开始添加好友， userID=${userID}, friendID=${friendID}"))
  
      // Step 1: 验证输入参数
      _ <- if (userID == null || userID.trim.isEmpty)
        IO.raiseError(new IllegalArgumentException("用户ID不能为空"))
      else IO.unit
  
      _ <- if (friendID == null || friendID.trim.isEmpty)
        IO.raiseError(new IllegalArgumentException("好友ID不能为空"))
      else IO.unit
  
      // Step 2.1: 查询当前用户的好友列表
      querySQL <- IO { s"SELECT friend_list FROM ${schemaName}.user_social_table WHERE user_id = ?" }
      parameters <- IO { List(SqlParameter("String", userID)) }
      friendListJson <- readDBJsonOptional(querySQL, parameters)
  
      // Step 2.2: 如果用户不存在，返回错误信息
      _ <- friendListJson match {
        case None => IO.raiseError(new IllegalStateException(s"用户ID ${userID} 不存在"))
        case Some(_) => IO(logger.info(s"成功查询到用户 ${userID} 的好友列表"))
      }
  
      // Step 3: 获取现有好友列表
      currentFriendList <- IO {
        friendListJson
          .map(json => decodeField[List[String]](json, "friend_list"))
          .getOrElse(List.empty)
      }
      _ <- IO(logger.info(s"当前的好友列表为：${currentFriendList.mkString(", ")}"))
  
      // Step 4: 检查好友ID是否已经存在于好友列表中
      _ <- if (currentFriendList.contains(friendID))
        IO.raiseError(new IllegalStateException("好友已存在"))
      else IO(logger.info(s"好友 ${friendID} 不在好友列表中，可以添加"))
  
      // Step 5.1: 将新的friendID加入好友列表
      updatedFriendList <- IO { currentFriendList :+ friendID }
      _ <- IO(logger.info(s"更新后的好友列表为：${updatedFriendList.mkString(", ")}"))
  
      // Step 5.2: 保存更新后的好友列表到数据库
      updateSQL <- IO { s"UPDATE ${schemaName}.user_social_table SET friend_list = ? WHERE user_id = ?" }
      updateParameters <- IO {
        List(
          SqlParameter("String", updatedFriendList.asJson.noSpaces),
          SqlParameter("String", userID)
        )
      }
      _ <- writeDB(updateSQL, updateParameters)
  
      // Step 6: 返回操作结果
      _ <- IO(logger.info("好友添加成功"))
    } yield "好友添加成功"
  }
  
  
  def removeFriendEntry(userID: String, friendID: String)(using PlanContext): IO[Option[String]] = {
    for {
      _ <- IO(logger.info(s"开始执行 removeFriendEntry 方法，输入参数 userID=${userID}, friendID=${friendID}"))
      
      // Step 1: 验证输入参数
      _ <- if (userID.isEmpty || friendID.isEmpty) 
             IO.raiseError(new IllegalArgumentException("userID和friendID不能为空"))
           else IO(logger.info("输入参数验证通过"))
  
      // Step 2: 查询用户的好友列表
      querySql <- IO(s"SELECT friend_list FROM ${schemaName}.user_social_table WHERE user_id = ?")
      queryParams <- IO(List(SqlParameter("String", userID)))
      maybeJson <- readDBJsonOptional(querySql, queryParams)
      _ <- IO(logger.info(s"从数据库中读取好友列表完成，结果是否存在：${maybeJson.isDefined}"))
  
      // Step 3: 移除好友ID
      updatedFriendList <- maybeJson match {
        case Some(json) =>
          val originalFriendList = decodeField[List[String]](json, "friend_list")
          IO(logger.info(s"当前好友列表：${originalFriendList.mkString(", ")}")) *>
            IO(originalFriendList.filterNot(_ == friendID))
        case None =>
          IO.raiseError(new NoSuchElementException(s"未找到 userID=${userID} 的记录"))
      }
      _ <- IO(logger.info(s"更新后的好友列表（移除 friendID=${friendID}）：${updatedFriendList.mkString(", ")}"))
  
      // Step 4: 更新好友列表到数据库
      updateSql <- IO(s"UPDATE ${schemaName}.user_social_table SET friend_list = ? WHERE user_id = ?")
      updateParams <- IO(
        List(
          SqlParameter("Array[String]", updatedFriendList.asJson.noSpaces),
          SqlParameter("String", userID)
        )
      )
      updateResult <- writeDB(updateSql, updateParams)
      _ <- IO(logger.info(s"数据库更新结果：${updateResult}"))
  
      // Step 5: 返回操作结果
    } yield Some("操作成功！")
  }
  
  
  def addToBlacklist(userID: String, blackUserID: String)(using PlanContext): IO[String] = {
    for {
      // Step 1.1: Validate userID
      _ <- if (userID.isEmpty) IO.raiseError(new IllegalArgumentException("用户ID不能为空")) else IO.unit
      _ <- IO(logger.info(s"用户ID验证通过，userID=${userID}"))
  
      // Step 1.2: Validate blackUserID
      _ <- if (blackUserID.isEmpty) IO.raiseError(new IllegalArgumentException("黑名单用户ID不能为空")) else IO.unit
      _ <- IO(logger.info(s"黑名单用户ID验证通过，blackUserID=${blackUserID}"))
  
      // Step 2.1: Retrieve user's blacklist
      sqlQuery <- IO {
        s"SELECT black_list FROM ${schemaName}.user_social_table WHERE user_id = ?"
      }
      params <- IO {
        List(SqlParameter("String", userID))
      }
      blackListJsonOpt <- readDBJsonOptional(sqlQuery, params)
      blackList <- IO {
        blackListJsonOpt match {
          case Some(json) =>
            decodeField[List[String]](json, "black_list")
          case None =>
            throw new IllegalStateException(s"用户ID[userID=${userID}]的黑名单信息不存在")
        }
      }
      _ <- IO(logger.info(s"获取当前用户的黑名单，当前黑名单内容=${blackList.mkString("[", ", ", "]")}"))
  
      // Step 3.1: Check if blackUserID already exists
      _ <- if (blackList.contains(blackUserID)) {
        IO.raiseError(new IllegalArgumentException(s"用户[blackUserID=${blackUserID}]已在黑名单中"))
      } else IO.unit
  
      // Step 3.2: Add blackUserID to user's blacklist
      updatedBlackList <- IO {
        blackUserID :: blackList
      }
      _ <- IO(logger.info(s"更新后的黑名单列表=${updatedBlackList.mkString("[", ", ", "]")}"))
      updateSql <- IO {
        s"UPDATE ${schemaName}.user_social_table SET black_list = ? WHERE user_id = ?"
      }
      updateParams <- IO {
        List(
          SqlParameter("Array[String]", updatedBlackList.asJson.noSpaces),
          SqlParameter("String", userID)
        )
      }
      _ <- writeDB(updateSql, updateParams)
  
      // Step 4.1: Return operation result
      resultMessage <- IO {
        "加入黑名单成功！"
      }
      _ <- IO(logger.info(s"操作完成，返回结果：${resultMessage}"))
    } yield resultMessage
  }
}
