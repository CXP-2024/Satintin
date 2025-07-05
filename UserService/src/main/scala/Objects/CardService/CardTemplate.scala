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
 * CardTemplate
 * desc: 卡牌模板的基本信息
 * @param cardID: String (卡牌模板的唯一ID)
 * @param cardName: String (卡牌模板的名称)
 * @param rarity: String (卡牌模板的稀有程度)
 * @param description: String (卡牌模板的描述信息)
 * @param cardType: String (卡牌模板的类型)
 */

case class CardTemplate(
  cardID: String,
  cardName: String,
  rarity: String,
  description: String,
  cardType: String
){

  //process class code 预留标志位，不要删除


}


case object CardTemplate{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[CardTemplate] = deriveEncoder
  private val circeDecoder: Decoder[CardTemplate] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[CardTemplate] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[CardTemplate] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[CardTemplate]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given cardTemplateEncoder: Encoder[CardTemplate] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given cardTemplateDecoder: Decoder[CardTemplate] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}
