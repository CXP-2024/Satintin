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
import Objects.CardService.CardEntry

/**
 * DrawResult
 * desc: 抽卡结果信息，用于表示抽卡的结果详情
 * @param cardList: CardEntry:1124 (抽中卡牌的列表)
 * @param isNewCard: Boolean (是否是新抽到的卡牌)
 */

case class DrawResult(
  cardList: List[CardEntry],
  isNewCard: Boolean
){

  //process class code 预留标志位，不要删除


}


case object DrawResult{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[DrawResult] = deriveEncoder
  private val circeDecoder: Decoder[DrawResult] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[DrawResult] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[DrawResult] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[DrawResult]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given drawResultEncoder: Encoder[DrawResult] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given drawResultDecoder: Decoder[DrawResult] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

