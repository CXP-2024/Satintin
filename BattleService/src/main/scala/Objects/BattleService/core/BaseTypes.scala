package Objects.BattleService.core

import Objects.BattleService.*
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils

import scala.util.Try

// ==================== 基础攻击类型 ====================

sealed trait AttackType
object AttackType {
  case object Normal extends AttackType        // 普通攻击
  case object Penetration extends AttackType   // 穿透攻击
  case object AntiAir extends AttackType       // 防弹攻击
  case object Nuclear extends AttackType       // 核爆攻击
  
  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[AttackType] = deriveEncoder
  private val circeDecoder: Decoder[AttackType] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[AttackType] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[AttackType] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[AttackType]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given attackTypeEncoder: Encoder[AttackType] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given attackTypeDecoder: Decoder[AttackType] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
}

// ==================== 基础类别 ====================

sealed trait BaseClass
object BaseClass {
  case object Sa extends BaseClass           // 撒
  case object Tin extends BaseClass         // tin
  case object Penetration extends BaseClass // 穿透类
  case object AntiAir extends BaseClass     // 防弹类
  case object Nuclear extends BaseClass     // 核爆类
  
  case object Cake extends BaseClass        // 饼类
  case object Shield extends BaseClass      // 弹类（盾类）
  
  case object Defense extends BaseClass     // 防御类
  case object TypeDefense extends BaseClass // 类型防御类
  case object ObjectDefense extends BaseClass // 对象防御类
  case object ActionDefense extends BaseClass // 行动防御类

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[BaseClass] = deriveEncoder
  private val circeDecoder: Decoder[BaseClass] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[BaseClass] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[BaseClass] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[BaseClass]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given baseClassEncoder: Encoder[BaseClass] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given baseClassDecoder: Decoder[BaseClass] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
}

// ==================== 行动类型 ====================

sealed trait ActionCategory
object ActionCategory {
  case object Active extends ActionCategory   // 主动行动
  case object Passive extends ActionCategory // 被动行动
  
  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[ActionCategory] = deriveEncoder
  private val circeDecoder: Decoder[ActionCategory] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ActionCategory] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[ActionCategory] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ActionCategory]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given actionCategoryEncoder: Encoder[ActionCategory] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given actionCategoryDecoder: Decoder[ActionCategory] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
}

// ==================== 游戏状态 ====================

sealed trait GameStatus
object GameStatus {
  case object InProgress extends GameStatus
  case object Player1Win extends GameStatus
  case object Player2Win extends GameStatus
  case object Draw extends GameStatus
  
  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[GameStatus] = deriveEncoder
  private val circeDecoder: Decoder[GameStatus] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[GameStatus] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[GameStatus] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[GameStatus]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given gameStatusEncoder: Encoder[GameStatus] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given gameStatusDecoder: Decoder[GameStatus] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
}