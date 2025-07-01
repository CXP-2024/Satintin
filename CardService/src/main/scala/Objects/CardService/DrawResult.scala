package Objects.CardService

import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils
import scala.util.Try
import org.joda.time.DateTime
import java.util.UUID
import Objects.CardService.CardEntry

// new structure sent to front-end
case class DrawCardInfo(
  cardID: String,
  cardName: String,
  rarity: String,
  description: String,
  creationTime: Long
)

/**
 * DrawResult
 * desc: 抽卡结果信息，用于表示抽卡的结果详情
 * @param cardList: 列表包含 DrawCardInfo
 * @param isNewCard: Boolean (是否是新抽到的卡牌)
 */
case class DrawResult(
  cardList: List[DrawCardInfo],
  isNewCard: Boolean
){
  // process class code 预留标志位，不要删除
}

object DrawResult {
  // Implicits for circe to encode/decode DrawCardInfo and DrawResult
  implicit val drawCardInfoEncoder: Encoder[DrawCardInfo] = deriveEncoder[DrawCardInfo]
  implicit val drawCardInfoDecoder: Decoder[DrawCardInfo] = deriveDecoder[DrawCardInfo]

  // Circe encoders
  private val circeEncoder: Encoder[DrawResult] = deriveEncoder[DrawResult]
  private val circeDecoder: Decoder[DrawResult] = deriveDecoder[DrawResult]

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[DrawResult] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[DrawResult] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[DrawResult]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Final combined encoders
  implicit val drawResultEncoder: Encoder[DrawResult] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  implicit val drawResultDecoder: Decoder[DrawResult] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }

  //process object code 预留标志位，不要删除


}

