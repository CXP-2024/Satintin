package APIs.UserService

import Common.API.API
import Global.ServiceCenter.UserServiceCode
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

/**
 * QueryIDByUserNameMessage
 * desc: 根据用户名查询用户ID
 * @param username: String (用户名)
 * @return userID: String (用户的唯一标识ID，如果用户不存在则抛出异常)
 */

case class QueryIDByUserNameMessage(
  username: String
) extends API[String](UserServiceCode)



case object QueryIDByUserNameMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[QueryIDByUserNameMessage] = deriveEncoder
  private val circeDecoder: Decoder[QueryIDByUserNameMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[QueryIDByUserNameMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[QueryIDByUserNameMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[QueryIDByUserNameMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given queryIDByUserNameMessageEncoder: Encoder[QueryIDByUserNameMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given queryIDByUserNameMessageDecoder: Decoder[QueryIDByUserNameMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }

}
