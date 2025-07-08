package APIs.AssetService

import Common.API.API
import Global.ServiceCenter.AssetServiceCode

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
 * CreateAssetTransactionMessage
 * desc: 创建用户资产的变动记录，并实时更新资产状态。
 * @param : String (用户的认证令牌，用于身份验证。)
 * @param transactionType: String (资产变动类型，例如CHARGE、PURCHASE或REWARD。)
 * @param changeAmount: Int (资产变动数量，正数表示增加，负数表示减少。)
 * @param changeReason: String (资产变动原因，例如购买物品或活动REWARD。)
 * @return result: String (表示资产交易记录成功的信息。)
 */

case class CreateAssetTransactionMessage(
  : String,
  transactionType: String,
  changeAmount: Int,
  changeReason: String
) extends API[String](AssetServiceCode)



case object CreateAssetTransactionMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[CreateAssetTransactionMessage] = deriveEncoder
  private val circeDecoder: Decoder[CreateAssetTransactionMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[CreateAssetTransactionMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[CreateAssetTransactionMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[CreateAssetTransactionMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given createAssetTransactionMessageEncoder: Encoder[CreateAssetTransactionMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given createAssetTransactionMessageDecoder: Decoder[CreateAssetTransactionMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

