package Objects.BattleService.core

import Objects.BattleService.*
import Objects.BattleService.core.{ActionCategory, PassiveObject}
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils

import scala.util.Try

// ==================== 被动行动 ====================

sealed trait PassiveAction {
  def actionCategory: ActionCategory = ActionCategory.Passive
  def passiveObject: PassiveObject
}

/**
 * 被动行动的具体实现
 */
case class PassiveActionImpl(
  passiveObject: PassiveObject
) extends PassiveAction

object PassiveAction {
  
  // 创建被动行动的工厂方法
  def create(passiveObject: PassiveObject): PassiveAction = {
    PassiveActionImpl(passiveObject)
  }
  
  // 为具体实现类创建编码器和解码器
  private val circeEncoder: Encoder[PassiveActionImpl] = deriveEncoder
  private val circeDecoder: Decoder[PassiveActionImpl] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[PassiveActionImpl] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[PassiveActionImpl] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[PassiveActionImpl]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // 为 PassiveAction trait 创建编码器
  given passiveActionEncoder: Encoder[PassiveAction] = Encoder.instance { action =>
    action match {
      case impl: PassiveActionImpl => 
        Try(circeEncoder(impl)).getOrElse(jacksonEncoder(impl))
      case _ => 
        // 如果是其他实现，手动编码
        Json.obj(
          "passiveObject" -> action.passiveObject.asJson
        )
    }
  }

  // 为 PassiveAction trait 创建解码器
  given passiveActionDecoder: Decoder[PassiveAction] = Decoder.instance { cursor =>
    // 首先尝试解码为 PassiveActionImpl
    val implResult = circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
    
    implResult match {
      case Right(impl) => Right(impl)
      case Left(_) => 
        // 如果失败，尝试手动解码
        for {
          passiveObject <- cursor.downField("passiveObject").as[PassiveObject]
        } yield PassiveActionImpl(passiveObject)
    }
  }
}