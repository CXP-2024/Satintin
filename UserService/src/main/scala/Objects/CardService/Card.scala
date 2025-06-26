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
 * Card
 * desc: 卡片的基本信息
 * @param cardID: String (卡片的唯一ID)
 * @param cardName: String (卡片的名称)
 * @param rarity: String (卡片的稀有程度)
 * @param description: String (卡片的描述信息)
 * @param creationTime: DateTime (卡片创建的时间)
 */

case class Card(
  cardID: String,
  cardName: String,
  rarity: String,
  description: String,
  creationTime: DateTime
){

  //process class code 预留标志位，不要删除


}


case object Card{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[Card] = deriveEncoder
  private val circeDecoder: Decoder[Card] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[Card] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[Card] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[Card]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given cardEncoder: Encoder[Card] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given cardDecoder: Decoder[Card] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

