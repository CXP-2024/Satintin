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


/**
 * UpgradeCardMessage
 * desc: 扣减升级资源并将指定卡牌进行升级。
 * @param userToken: String (用户的身份认证令牌)
 * @param cardID: String (需要进行升级的卡牌ID)
 * @return result: String (卡牌升级完成后的提示信息)
 */

case class UpgradeCardMessage(
  userToken: String,
  cardID: String
) extends API[String](CardServiceCode)



case object UpgradeCardMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[UpgradeCardMessage] = deriveEncoder
  private val circeDecoder: Decoder[UpgradeCardMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[UpgradeCardMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[UpgradeCardMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[UpgradeCardMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given upgradeCardMessageEncoder: Encoder[UpgradeCardMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given upgradeCardMessageDecoder: Decoder[UpgradeCardMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

