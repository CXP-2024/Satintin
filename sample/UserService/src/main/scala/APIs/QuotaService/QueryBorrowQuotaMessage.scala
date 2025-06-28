package APIs.QuotaService

import Common.API.API
import Global.ServiceCenter.QuotaServiceCode

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
import Objects.QuotaService.BorrowQuota

/**
 * QueryBorrowQuotaMessage
 * desc: 查询用户配额，用于配额管理
 * @param userToken: String (用户的认证Token，用于验证用户身份和权限)
 * @return quotaDetails: BorrowQuota:2088 (用户在不同类别下的配额详情)
 */

case class QueryBorrowQuotaMessage(
  userToken: String
) extends API[List[BorrowQuota]](QuotaServiceCode)



case object QueryBorrowQuotaMessage{
    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[QueryBorrowQuotaMessage] = deriveEncoder
  private val circeDecoder: Decoder[QueryBorrowQuotaMessage] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[QueryBorrowQuotaMessage] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[QueryBorrowQuotaMessage] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[QueryBorrowQuotaMessage]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given queryBorrowQuotaMessageEncoder: Encoder[QueryBorrowQuotaMessage] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given queryBorrowQuotaMessageDecoder: Decoder[QueryBorrowQuotaMessage] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }


}

