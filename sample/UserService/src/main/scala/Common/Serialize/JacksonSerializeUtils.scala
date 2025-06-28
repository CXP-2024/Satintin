package Common.Serialize

import Common.API.TraceID
import Common.Object.SqlParameter
import Common.Object.IDClass
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind.module.SimpleModule
import com.fasterxml.jackson.databind.{DeserializationFeature, JsonDeserializer, JsonSerializer, ObjectMapper, SerializerProvider}
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import io.circe.{Json, ParsingFailure, parser}
import org.joda.time.DateTime
import org.slf4j.{Logger, LoggerFactory}

case object JacksonSerializeUtils {

  private val log: Logger = LoggerFactory.getLogger(this.getClass.getSimpleName)

  /**
   * 如果一个字段是 String
   * > json 反序列化为对象时, 如果为 null (json-value)，会有类似的报错 - 例如 com.fasterxml.jackson.databind.exc.MismatchedInputException: Cannot deserialize value of type `java.lang.String` from null
   * > 对象序列化为 json 时，如果属性为 null (object-field)，会序列化为 Null
   */
  lazy val jacksonMapper: ObjectMapper = {
    //序列化器配置 - // 忽略未知字段 - 忽略 class 中没有，但 json 中有的字段
    val mapper = new ObjectMapper()

    def customJacksonModule: SimpleModule = {
      val module = new SimpleModule()
      module.addSerializer(classOf[IDClass], new IDClassSerializer)
      module.addDeserializer(classOf[IDClass], new IDClassDeserializer(id => IDClass(id)))

      module.addSerializer(classOf[DateTime], new DateTimeSerializer)
      module.addDeserializer(classOf[DateTime], new DateTimeDeserializer)

      module.addSerializer(classOf[TraceID], new TraceIDSerializer)
      module.addDeserializer(classOf[TraceID], new TraceIDDeserializer(id => TraceID(id)))

      module
    }

    mapper
      .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
      .registerModule(DefaultScalaModule)
      .registerModule(customJacksonModule) // 注册自定义规则

  }


  def serialize(o: AnyRef): String = {
    jacksonMapper.writeValueAsString(o)
  }

  def serializeToJsonOption(o: AnyRef): Option[Json] = {
    parser.parse(JacksonSerializeUtils.serialize(o)).toOption
  }

  def serializeToJson(o: AnyRef): Json = {
    parser.parse(JacksonSerializeUtils.serialize(o)) match {
      case Left(value: ParsingFailure) =>
        log.error(s"serializeToJson failed, object = ${o}, err = ", value)
        throw new IllegalStateException(s"serializeToJson failed, object = ${o}")

      case Right(value) => value
    }
  }

  def deserialize[T](jsonString: String, typeReference: TypeReference[T]): T = {
    jacksonMapper.readValue(jsonString, typeReference)
  }

}


// IDClass Jackson 序列化
class IDClassSerializer extends JsonSerializer[IDClass] {
  override def serialize(value: IDClass, gen: com.fasterxml.jackson.core.JsonGenerator, serializers: SerializerProvider): Unit = {
    gen.writeNumber(value.v) // 只存 v
  }
}

// IDClass Jackson 反序列化
class IDClassDeserializer[T <: IDClass](factory: Int => T) extends JsonDeserializer[T] {
  override def deserialize(p: com.fasterxml.jackson.core.JsonParser, ctxt: com.fasterxml.jackson.databind.DeserializationContext): T = {
    factory(p.getIntValue) // 从 int 创建对象
  }
}

// ========== DateTime 支持 ==========
class DateTimeSerializer extends JsonSerializer[DateTime] {
  override def serialize(value: DateTime, gen: com.fasterxml.jackson.core.JsonGenerator, serializers: SerializerProvider): Unit = {
    gen.writeNumber(value.getMillis) // 以毫秒存储
  }
}

class DateTimeDeserializer extends JsonDeserializer[DateTime] {
  override def deserialize(p: com.fasterxml.jackson.core.JsonParser, ctxt: com.fasterxml.jackson.databind.DeserializationContext): DateTime = {
    new DateTime(p.getLongValue)
  }
}

// TraceID Jackson 序列化
class TraceIDSerializer extends JsonSerializer[TraceID] {
  override def serialize(value: TraceID, gen: com.fasterxml.jackson.core.JsonGenerator, serializers: SerializerProvider): Unit = {
    gen.writeString(value.id) // 只存 v
  }
}

// TraceID Jackson 反序列化
class TraceIDDeserializer[T <: TraceID](factory: String => T) extends JsonDeserializer[T] {
  override def deserialize(p: com.fasterxml.jackson.core.JsonParser, ctxt: com.fasterxml.jackson.databind.DeserializationContext): T = {
    factory(p.getText()) // 从 int 创建对象
  }
}
