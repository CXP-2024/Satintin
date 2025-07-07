package Objects.BattleService.core

import Objects.BattleService.*
import Objects.BattleService.core.{BaseClass, AttackType}
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils

import scala.util.Try

// ==================== 攻击对象基类 ====================

/**
 * 攻击对象 - 游戏中的基础攻击单位
 * @param objectName 对象名称
 * @param attackType 攻击类型
 * @param damage 攻击伤害
 * @param defense 防御力
 * @param energyCost 能量消耗
 * @param baseClass 基础类别
 * @param description 对象描述
 */
case class AttackObject( 
  objectName: String,
  attackType: AttackType,
  damage: Int,
  defense: Int,
  energyCost: Int,
  baseClass: BaseClass,
  description: String = ""
) {
  
  // 验证攻击对象的有效性
  require(damage >= 0, "攻击伤害不能为负数")
  require(defense >= 0, "防御力不能为负数")
  require(energyCost >= 0, "能量消耗不能为负数")
  require(objectName.nonEmpty, "对象名称不能为空")
  
  // 检查攻击类型和基础类别是否匹配
  def isConsistent: Boolean = (baseClass, attackType) match {
    case (BaseClass.Sa, AttackType.Normal) => true
    case (BaseClass.Tin, AttackType.Normal) => true
    case (BaseClass.Penetration, AttackType.Penetration) => true
    case (BaseClass.AntiAir, AttackType.AntiAir) => true
    case (BaseClass.Nuclear, AttackType.Nuclear) => true
    case _ => false
  }

  override def toString: String = s"$objectName($attackType:$damage/$defense:$energyCost)"
}

object AttackObject {
  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[AttackObject] = deriveEncoder
  private val circeDecoder: Decoder[AttackObject] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[AttackObject] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[AttackObject] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[AttackObject]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given attackObjectEncoder: Encoder[AttackObject] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given attackObjectDecoder: Decoder[AttackObject] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
  
  def CreateAttackObject(name: String, attackType: AttackType, damage: Int, defense: Int, energyCost: Int, baseClass: BaseClass): AttackObject = {
    AttackObject(name, attackType, damage, defense, energyCost, baseClass)
  }
  
  // 验证攻击对象的一致性
  def validateConsistency(attackObject: AttackObject): Either[String, AttackObject] = {
    if (attackObject.isConsistent) {
      Right(attackObject)
    } else {
      Left(s"攻击对象 ${attackObject.objectName} 的基础类别 ${attackObject.baseClass} 与攻击类型 ${attackObject.attackType} 不匹配")
    }
  }
}