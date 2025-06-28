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
 * LoginAdminMessage
 * desc: 管理员登录，返回 token
 * @param accountName: String 管理员账号名
 * @param passwordHash: String 管理员密码哈希
 * @return String: 管理员token
 */
case class LoginAdminMessage(
  accountName: String,
  passwordHash: String
) extends API[String](AdminServiceCode)

object LoginAdminMessage {
  private val circeEncoder: Encoder[LoginAdminMessage] = deriveEncoder
  private val circeDecoder: Decoder[LoginAdminMessage] = deriveDecoder
  private val jacksonEncoder: Encoder[LoginAdminMessage] = Encoder.instance(o => Json.fromString(JacksonSerializeUtils.serialize(o)))
  private val jacksonDecoder: Decoder[LoginAdminMessage] = Decoder.instance { cursor =>
    Try(Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[LoginAdminMessage]() {})))
      .getOrElse(Left(io.circe.DecodingFailure("LoginAdminMessage jackson decode error", cursor.history)))
  }

  given Encoder[LoginAdminMessage] = Encoder.instance(o => Try(circeEncoder(o)).getOrElse(jacksonEncoder(o)))
  given Decoder[LoginAdminMessage] = Decoder.instance(cursor => circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor)))
}
