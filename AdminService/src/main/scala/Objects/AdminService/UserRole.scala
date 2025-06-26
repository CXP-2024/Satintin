package Objects.AdminService

import com.fasterxml.jackson.databind.annotation.{JsonDeserialize, JsonSerialize}
import com.fasterxml.jackson.core.{JsonGenerator, JsonParser}
import com.fasterxml.jackson.databind.{DeserializationContext, JsonDeserializer, JsonSerializer, SerializerProvider}
import io.circe.{Decoder, Encoder}

@JsonSerialize(`using` = classOf[UserRoleSerializer])
@JsonDeserialize(`using` = classOf[UserRoleDeserializer])
enum UserRole(val desc: String):

  override def toString: String = this.desc

  case Admin extends UserRole("系统管理员角色") // 系统管理员角色
  case Normal extends UserRole("普通用户角色") // 普通用户角色


object UserRole:
  given encode: Encoder[UserRole] = Encoder.encodeString.contramap[UserRole](toString)

  given decode: Decoder[UserRole] = Decoder.decodeString.emap(fromStringEither)

  def fromString(s: String):UserRole  = s match
    case "系统管理员角色" => Admin
    case "普通用户角色" => Normal
    case _ => throw Exception(s"Unknown UserRole: $s")

  def fromStringEither(s: String):Either[String, UserRole]  = s match
    case "系统管理员角色" => Right(Admin)
    case "普通用户角色" => Right(Normal)
    case _ => Left(s"Unknown UserRole: $s")

  def toString(t: UserRole): String = t match
    case Admin => "系统管理员角色"
    case Normal => "普通用户角色"


// Jackson 序列化器
class UserRoleSerializer extends JsonSerializer[UserRole] {
  override def serialize(value: UserRole, gen: JsonGenerator, serializers: SerializerProvider): Unit = {
    gen.writeString(UserRole.toString(value)) // 直接写出字符串
  }
}

// Jackson 反序列化器
class UserRoleDeserializer extends JsonDeserializer[UserRole] {
  override def deserialize(p: JsonParser, ctxt: DeserializationContext): UserRole = {
    UserRole.fromString(p.getText)
  }
}

