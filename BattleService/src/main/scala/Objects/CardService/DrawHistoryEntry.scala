package Objects.CardService

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
 * DrawHistoryEntry
 * desc: 抽卡历史记录条目
 * @param drawId: String (抽卡记录的唯一ID)
 * @param cardId: String (卡牌的唯一ID)
 * @param cardName: String (卡牌名称)
 * @param cardDescription: String (卡牌描述)
 * @param rarity: String (卡牌稀有度)
 * @param cardType: String (卡牌类型)
 * @param drawTime: DateTime (抽卡时间)
 * @param poolType: String (卡池类型)
 */
case class DrawHistoryEntry(
  drawId: String,
  cardId: String,
  cardName: String,
  cardDescription: String,
  rarity: String,
  cardType: String,
  drawTime: DateTime,
  poolType: String
) {
  //process class code 预留标志位，不要删除
}

case object DrawHistoryEntry {
  
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[DrawHistoryEntry] = deriveEncoder
  private val circeDecoder: Decoder[DrawHistoryEntry] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[DrawHistoryEntry] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[DrawHistoryEntry] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[DrawHistoryEntry]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given drawHistoryEntryEncoder: Encoder[DrawHistoryEntry] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given drawHistoryEntryDecoder: Decoder[DrawHistoryEntry] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }

  //process object code 预留标志位，不要删除
}
