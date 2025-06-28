package APIs.AdminService

import Common.API.API
import Global.ServiceCenter.AdminServiceCode
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax._
import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils
import scala.util.Try

/**
 * CreateAdminMessage
 * desc: 通过超级管理员Token创建新管理员
 * @param superAdminToken: String 超级管理员Token
 * @param username: String 新管理员用户名
 * @param passwordHash: String 新管理员密码哈希
 * @return String: 新管理员ID
 */
case class CreateAdminMessage(
  superAdminToken: String,
  username: String,
  passwordHash: String
) extends API[String](AdminServiceCode)

object CreateAdminMessage {
  private val circeEncoder: Encoder[CreateAdminMessage] = deriveEncoder
  private val circeDecoder: Decoder[CreateAdminMessage] = deriveDecoder
  private val jacksonEncoder: Encoder[CreateAdminMessage] = Encoder.instance(o => Json.fromString(JacksonSerializeUtils.serialize(o)))
  private val jacksonDecoder: Decoder[CreateAdminMessage] = Decoder.instance { cursor =>
    Try(Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[CreateAdminMessage]() {})))
      .getOrElse(Left(io.circe.DecodingFailure("CreateAdminMessage jackson decode error", cursor.history)))
  }

  given Encoder[CreateAdminMessage] = Encoder.instance(o => Try(circeEncoder(o)).getOrElse(jacksonEncoder(o)))
  given Decoder[CreateAdminMessage] = Decoder.instance(cursor => circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor)))
}
