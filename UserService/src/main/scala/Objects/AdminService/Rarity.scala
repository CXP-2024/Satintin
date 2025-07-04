package Objects.AdminService

import com.fasterxml.jackson.databind.annotation.{JsonDeserialize, JsonSerialize}
import com.fasterxml.jackson.core.{JsonGenerator, JsonParser}
import com.fasterxml.jackson.databind.{DeserializationContext, JsonDeserializer, JsonSerializer, SerializerProvider}
import io.circe.{Decoder, Encoder}

@JsonSerialize(`using` = classOf[RaritySerializer])
@JsonDeserialize(`using` = classOf[RarityDeserializer])
enum Rarity(val desc: String):

  override def toString: String = this.desc

  case Common extends Rarity("普通稀有度") // 普通稀有度
  case Rare extends Rarity("稀有稀有度") // 稀有稀有度
  case Legendary extends Rarity("传奇稀有度") // 传奇稀有度


object Rarity:
  given encode: Encoder[Rarity] = Encoder.encodeString.contramap[Rarity](toString)

  given decode: Decoder[Rarity] = Decoder.decodeString.emap(fromStringEither)

  def fromString(s: String):Rarity  = s match
    case "普通稀有度" => Common
    case "稀有稀有度" => Rare
    case "传奇稀有度" => Legendary
    case _ => throw Exception(s"Unknown Rarity: $s")

  def fromStringEither(s: String):Either[String, Rarity]  = s match
    case "普通稀有度" => Right(Common)
    case "稀有稀有度" => Right(Rare)
    case "传奇稀有度" => Right(Legendary)
    case _ => Left(s"Unknown Rarity: $s")

  def toString(t: Rarity): String = t match
    case Common => "普通稀有度"
    case Rare => "稀有稀有度"
    case Legendary => "传奇稀有度"


// Jackson 序列化器
class RaritySerializer extends JsonSerializer[Rarity] {
  override def serialize(value: Rarity, gen: JsonGenerator, serializers: SerializerProvider): Unit = {
    gen.writeString(Rarity.toString(value)) // 直接写出字符串
  }
}

// Jackson 反序列化器
class RarityDeserializer extends JsonDeserializer[Rarity] {
  override def deserialize(p: JsonParser, ctxt: DeserializationContext): Rarity = {
    Rarity.fromString(p.getText)
  }
}

