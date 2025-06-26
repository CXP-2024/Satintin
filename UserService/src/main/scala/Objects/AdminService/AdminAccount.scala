package Objects.AdminService


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
 * AdminAccount
 * desc: 管理员账户信息
 * @param adminID: String (管理员唯一ID)
 * @param accountName: String (管理员账户名称)
 * @param passwordHash: String (管理员账户密码的哈希值)
 * @param createTime: DateTime (账户创建时间)
 */

case class AdminAccount(
  adminID: String,
  accountName: String,
  passwordHash: String,
  createTime: DateTime
){

  //process class code 预留标志位，不要删除


}


case object AdminAccount{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[AdminAccount] = deriveEncoder
  private val circeDecoder: Decoder[AdminAccount] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[AdminAccount] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[AdminAccount] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[AdminAccount]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given adminAccountEncoder: Encoder[AdminAccount] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given adminAccountDecoder: Decoder[AdminAccount] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

