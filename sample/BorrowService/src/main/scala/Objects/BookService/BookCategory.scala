package Objects.BookService

import com.fasterxml.jackson.databind.annotation.{JsonDeserialize, JsonSerialize}
import com.fasterxml.jackson.core.{JsonGenerator, JsonParser}
import com.fasterxml.jackson.databind.{DeserializationContext, JsonDeserializer, JsonSerializer, SerializerProvider}
import io.circe.{Decoder, Encoder}

@JsonSerialize(`using` = classOf[BookCategorySerializer])
@JsonDeserialize(`using` = classOf[BookCategoryDeserializer])
enum BookCategory(val desc: String):

  override def toString: String = this.desc

  case Science extends BookCategory("科学") // 科学
  case Literature extends BookCategory("文学") // 文学
  case History extends BookCategory("历史") // 历史
  case Children extends BookCategory("儿童") // 儿童
  case Others extends BookCategory("其他") // 其他


object BookCategory:
  given encode: Encoder[BookCategory] = Encoder.encodeString.contramap[BookCategory](toString)

  given decode: Decoder[BookCategory] = Decoder.decodeString.emap(fromStringEither)

  def fromString(s: String):BookCategory  = s match
    case "科学" => Science
    case "文学" => Literature
    case "历史" => History
    case "儿童" => Children
    case "其他" => Others
    case _ => throw Exception(s"Unknown BookCategory: $s")

  def fromStringEither(s: String):Either[String, BookCategory]  = s match
    case "科学" => Right(Science)
    case "文学" => Right(Literature)
    case "历史" => Right(History)
    case "儿童" => Right(Children)
    case "其他" => Right(Others)
    case _ => Left(s"Unknown BookCategory: $s")

  def toString(t: BookCategory): String = t match
    case Science => "科学"
    case Literature => "文学"
    case History => "历史"
    case Children => "儿童"
    case Others => "其他"


// Jackson 序列化器
class BookCategorySerializer extends JsonSerializer[BookCategory] {
  override def serialize(value: BookCategory, gen: JsonGenerator, serializers: SerializerProvider): Unit = {
    gen.writeString(BookCategory.toString(value)) // 直接写出字符串
  }
}

// Jackson 反序列化器
class BookCategoryDeserializer extends JsonDeserializer[BookCategory] {
  override def deserialize(p: JsonParser, ctxt: DeserializationContext): BookCategory = {
    BookCategory.fromString(p.getText)
  }
}

