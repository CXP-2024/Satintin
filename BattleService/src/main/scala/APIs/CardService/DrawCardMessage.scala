package APIs.CardService

import Common.API.API
import Global.ServiceCenter.CardServiceCode

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
import Objects.CardService.DrawResult

/**
 * DrawCardMessage
 * desc: 根据原石数量扣减相关资产并返回抽卡结果。
 * @param userID: String (用户认证用的token，标识当前用户身份)
 * @param drawCount: Int (抽取卡牌的次数)
 * @return drawResult: DrawResult:1062 (抽卡结果数据，包含抽到的卡牌信息和是否有新卡)
 */

case class DrawCardMessage(
  userID: String,
  drawCount: Int
) extends API[DrawResult](CardServiceCode)



case object DrawCardMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[DrawCardMessage] = deriveEncoder
  private val circeDecoder: Decoder[DrawCardMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[DrawCardMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[DrawCardMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[DrawCardMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given drawCardMessageEncoder: Encoder[DrawCardMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given drawCardMessageDecoder: Decoder[DrawCardMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

