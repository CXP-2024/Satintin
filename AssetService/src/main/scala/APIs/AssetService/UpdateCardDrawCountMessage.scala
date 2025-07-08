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
 * UpdateCardDrawCountMessage
 * desc: 设置用户在指定卡池的抽卡次数记录
 * @param userID: String (用户的身份令牌，用于验证用户身份)
 * @param poolType: String (卡池类型，"standard"为标准池，"featured"为限定池)
 * @param drawCount: Int (要设置的抽卡次数数值)
 * @return result: String (操作结果信息，例如'抽卡次数更新成功！')
 */

case class UpdateCardDrawCountMessage(
  userID: String,
  poolType: String,
  drawCount: Int
) extends API[String](AssetServiceCode)

case object UpdateCardDrawCountMessage{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[UpdateCardDrawCountMessage] = deriveEncoder
  private val circeDecoder: Decoder[UpdateCardDrawCountMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[UpdateCardDrawCountMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[UpdateCardDrawCountMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[UpdateCardDrawCountMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given updateCardDrawCountMessageEncoder: Encoder[UpdateCardDrawCountMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given updateCardDrawCountMessageDecoder: Decoder[UpdateCardDrawCountMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }

  //process class code 预留标志位，不要删除

}
