package APIs.AssetService

import Common.API.API
import Global.ServiceCenter.AssetServiceCode

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
 * QueryCardDrawCountMessage
 * desc: 查询用户的当前抽卡次数（从AssetService）
 * @param userToken: String (用户的身份令牌，用于验证用户身份)
 * @return drawCount: Int (用户的当前抽卡次数)
 */

case class QueryCardDrawCountMessage(
  userToken: String
) extends API[Int](AssetServiceCode)

case object QueryCardDrawCountMessage{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[QueryCardDrawCountMessage] = deriveEncoder
  private val circeDecoder: Decoder[QueryCardDrawCountMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[QueryCardDrawCountMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[QueryCardDrawCountMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[QueryCardDrawCountMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given queryCardDrawCountMessageEncoder: Encoder[QueryCardDrawCountMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given queryCardDrawCountMessageDecoder: Decoder[QueryCardDrawCountMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }

  //process class code 预留标志位，不要删除

}
