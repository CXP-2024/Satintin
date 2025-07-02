package Objects.AdminService

import com.fasterxml.jackson.databind.annotation.{JsonDeserialize, JsonSerialize}
import com.fasterxml.jackson.core.{JsonGenerator, JsonParser}
import com.fasterxml.jackson.databind.{DeserializationContext, JsonDeserializer, JsonSerializer, SerializerProvider}
import io.circe.{Decoder, Encoder}

@JsonSerialize(`using` = classOf[ActionTypeSerializer])
@JsonDeserialize(`using` = classOf[ActionTypeDeserializer])
enum ActionType(val desc: String):

  override def toString: String = this.desc

  case Pancake extends ActionType("代表Pancake动作") // 代表Pancake动作
  case Defense extends ActionType("代表防御动作") // 代表防御动作
  case Spray extends ActionType("代表喷射动作") // 代表喷射动作


object ActionType:
  given encode: Encoder[ActionType] = Encoder.encodeString.contramap[ActionType](toString)

  given decode: Decoder[ActionType] = Decoder.decodeString.emap(fromStringEither)

  def fromString(s: String):ActionType  = s match
    case "代表Pancake动作" => Pancake
    case "代表防御动作" => Defense
    case "代表喷射动作" => Spray
    case _ => throw Exception(s"Unknown ActionType: $s")

  def fromStringEither(s: String):Either[String, ActionType]  = s match
    case "代表Pancake动作" => Right(Pancake)
    case "代表防御动作" => Right(Defense)
    case "代表喷射动作" => Right(Spray)
    case _ => Left(s"Unknown ActionType: $s")

  def toString(t: ActionType): String = t match
    case Pancake => "代表Pancake动作"
    case Defense => "代表防御动作"
    case Spray => "代表喷射动作"


// Jackson 序列化器
class ActionTypeSerializer extends JsonSerializer[ActionType] {
  override def serialize(value: ActionType, gen: JsonGenerator, serializers: SerializerProvider): Unit = {
    gen.writeString(ActionType.toString(value)) // 直接写出字符串
  }
}

// Jackson 反序列化器
class ActionTypeDeserializer extends JsonDeserializer[ActionType] {
  override def deserialize(p: JsonParser, ctxt: DeserializationContext): ActionType = {
    ActionType.fromString(p.getText)
  }
}

