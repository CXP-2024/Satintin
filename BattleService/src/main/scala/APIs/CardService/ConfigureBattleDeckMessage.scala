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
 * ConfigureBattleDeckMessage
 * desc: 根据玩家选择的卡牌，设置最多三张卡为对战卡组。
 * @param userToken: String (用户认证的令牌，用于验证用户身份。)
 * @param cardIDs: String (卡牌ID列表，包含用户选择的卡牌。)
 * @return result: String (卡组配置的操作结果信息，例如'战斗卡组设置成功！')
 */

case class ConfigureBattleDeckMessage(
  userToken: String,
  cardIDs: List[String]
) extends API[String](CardServiceCode)



case object ConfigureBattleDeckMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[ConfigureBattleDeckMessage] = deriveEncoder
  private val circeDecoder: Decoder[ConfigureBattleDeckMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ConfigureBattleDeckMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[ConfigureBattleDeckMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ConfigureBattleDeckMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given configureBattleDeckMessageEncoder: Encoder[ConfigureBattleDeckMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given configureBattleDeckMessageDecoder: Decoder[ConfigureBattleDeckMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

