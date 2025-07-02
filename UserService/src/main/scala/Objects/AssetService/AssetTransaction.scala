package Objects.AssetService


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
 * AssetTransaction
 * desc: 用户的资产交易记录
 * @param transactionID: String (交易的唯一标识符)
 * @param userID: String (用户的唯一标识符)
 * @param transactionType: String (交易类型，比如收入或支出)
 * @param changeAmount: Int (交易影响的资产数量变化)
 * @param changeReason: String (交易变化的原因说明)
 * @param timestamp: DateTime (交易发生的时间戳)
 */

case class AssetTransaction(
  transactionID: String,
  userID: String,
  transactionType: String,
  changeAmount: Int,
  changeReason: String,
  timestamp: DateTime
){

  //process class code 预留标志位，不要删除


}


case object AssetTransaction{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[AssetTransaction] = deriveEncoder
  private val circeDecoder: Decoder[AssetTransaction] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[AssetTransaction] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[AssetTransaction] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[AssetTransaction]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given assetTransactionEncoder: Encoder[AssetTransaction] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given assetTransactionDecoder: Decoder[AssetTransaction] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

