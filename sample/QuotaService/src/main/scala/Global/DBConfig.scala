package Global


import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import Common.Serialize.JacksonSerializeUtils
import com.fasterxml.jackson.core.`type`.TypeReference
import scala.util.Try


case class DBConfig(
                     /** 数据库地址，例如：jdbc:postgresql://localhost:5432/db */
                     jdbcUrl: String,

                     /** 用户名 */
                     username: String,

                     /** 密码 */
                     password: String,

                     schemaName: String = Common.ServiceUtils.schemaName,

                     /** 缓存的数据库statement个数 */
                     prepStmtCacheSize: Int = 250,

                     /** 缓存的数据库语句最大长度 */
                     prepStmtCacheSqlLimit: Int = 2048,

                     /** 最多能够保持的连接数目，建议=服务器的CPU核数*2+1 */
                     maximumPoolSize: Int = 36,

                     /** connection的最长存活时间 */
                     connectionLiveMinutes: Int = 8,

                     /** 服务器最多能够同时接受多少请求，这个数字可以大一点防止成为并发的瓶颈 */
                     maximumServerConnection: Int = 20000,
                   )

case object  DBConfig{
  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[DBConfig] = deriveEncoder
  private val circeDecoder: Decoder[DBConfig] = deriveDecoder

  // jackson 对应的 encoder, decoder
  private val jacksonEncoder: Encoder[DBConfig] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[DBConfig] = Decoder.instance{ cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[DBConfig]() {})) }
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }

  // Circe + Jackson 兜底的 Encoder
  given dbConfigEncoder: Encoder[DBConfig] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given dbConfigDecoder: Decoder[DBConfig] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }

}