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
 * GetAssetTransactionMessage
 * desc: 获取用户的所有资产交易记录。
 * @param userToken: String (用户的认证令牌，用于身份验证。)
 * @return transactions: String (用户的所有交易记录，以JSON格式返回。)
 */

case class GetAssetTransactionMessage(
  userToken: String
) extends API[String](AssetServiceCode)



case object GetAssetTransactionMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[GetAssetTransactionMessage] = deriveEncoder
  private val circeDecoder: Decoder[GetAssetTransactionMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[GetAssetTransactionMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }
  private val jacksonDecoder: Decoder[GetAssetTransactionMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[GetAssetTransactionMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given getAssetTransactionMessageEncoder: Encoder[GetAssetTransactionMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given getAssetTransactionMessageDecoder: Decoder[GetAssetTransactionMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}
