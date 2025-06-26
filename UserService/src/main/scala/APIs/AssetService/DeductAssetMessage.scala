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
 * DeductAssetMessage
 * desc: 减少用户的资产并记录相关操作。处理扣除资产的需求。
 * @param userToken: String (用户的身份令牌，用于验证用户身份)
 * @param deductAmount: Int (需要扣减的资产数量)
 * @return result: String (操作结果信息，例如‘资产扣减成功！’)
 */

case class DeductAssetMessage(
  userToken: String,
  deductAmount: Int
) extends API[String](AssetServiceCode)



case object DeductAssetMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[DeductAssetMessage] = deriveEncoder
  private val circeDecoder: Decoder[DeductAssetMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[DeductAssetMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[DeductAssetMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[DeductAssetMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given deductAssetMessageEncoder: Encoder[DeductAssetMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given deductAssetMessageDecoder: Decoder[DeductAssetMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

