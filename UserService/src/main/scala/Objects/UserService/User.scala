package Objects.UserService


import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils

import scala.util.Try

import org.joda.time.DateTime
import java.util.UUID
import Objects.UserService.FriendEntry
import Objects.UserService.BlackEntry
import Objects.UserService.MessageEntry

/**
 * User
 * desc: 用户的基本信息，包括账户、权限、社交等相关数据
 * @param userID: String (用户的唯一ID)
 * @param userName: String (用户名)
 * @param passwordHash: String (用户密码的哈希值)
 * @param email: String (用户的电子邮箱)
 * @param phoneNumber: String (用户的手机号码)
 * @param registerTime: DateTime (用户注册的时间)
 * @param permissionLevel: Int (用户的权限等级)
 * @param banDays: Int (用户当前被封禁的天数)
 * @param isOnline: Boolean (用户是否在线)
 * @param matchStatus: String (用户当前的匹配状态)
 * @param stoneAmount: Int (用户拥有的石头数量)
 * @param credits: Int (用户的积分数量)
 * @param rank: String (用户的段位)
 * @param rankPosition: Int (用户在段位中的排名)
 * @param friendList: FriendEntry (用户的好友列表)
 * @param blackList: BlackEntry (用户的黑名单列表)
 * @param messageBox: MessageEntry:1022 (用户的消息盒子)
 */

case class User(
  userID: String,
  userName: String,
  passwordHash: String,
  email: String,
  phoneNumber: String,
  registerTime: DateTime,
  permissionLevel: Int,
  banDays: Int,
  isOnline: Boolean,
  matchStatus: String,
  stoneAmount: Int,
  credits: Int,
  rank: String,
  rankPosition: Int,
  friendList: List[FriendEntry],
  blackList: List[BlackEntry],
  messageBox: List[MessageEntry]
){

  //process class code 预留标志位，不要删除


}


case object User{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[User] = deriveEncoder
  private val circeDecoder: Decoder[User] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[User] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[User] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[User]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given userEncoder: Encoder[User] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given userDecoder: Decoder[User] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

