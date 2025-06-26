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
 * CardEntry
 * desc: 卡牌的基本入口实体类
 * @param cardID: String (卡片的唯一ID)
 * @param rarityLevel: String (卡片稀有度评级)
 * @param cardLevel: Int (卡片等级)
 */

case class CardEntry(
  cardID: String,
  rarityLevel: String,
  cardLevel: Int
){

  //process class code 预留标志位，不要删除


}


case object CardEntry{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[CardEntry] = deriveEncoder
  private val circeDecoder: Decoder[CardEntry] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[CardEntry] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[CardEntry] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[CardEntry]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given cardEntryEncoder: Encoder[CardEntry] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given cardEntryDecoder: Decoder[CardEntry] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

