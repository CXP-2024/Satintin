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
 * QueryAssetStatusByIDMessage
 * desc: 管理员根据用户ID查询用户当前的原石数量
 * @param adminToken: String (管理员身份认证令牌，用于验证管理员权限)
 * @param userID: String (要查询的用户ID)
 * @return stoneAmount: Int (用户当前的原石数量)
 */
case class QueryAssetStatusByIDMessage(
  adminToken: String,
  userID: String
) extends API[Int](AssetServiceCode)

case object QueryAssetStatusByIDMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[QueryAssetStatusByIDMessage] = deriveEncoder
  private val circeDecoder: Decoder[QueryAssetStatusByIDMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[QueryAssetStatusByIDMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[QueryAssetStatusByIDMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[QueryAssetStatusByIDMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given queryAssetStatusByIDMessageEncoder: Encoder[QueryAssetStatusByIDMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given queryAssetStatusByIDMessageDecoder: Decoder[QueryAssetStatusByIDMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }

  //process class code 预留标志位，不要删除
}