package Objects.BattleService.core

import Objects.BattleService.*
import Objects.BattleService.core.{BaseClass, AttackType, AttackObject, ActiveAction}
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils

import scala.util.Try

// ==================== 被动对象基类 ====================

/**
 * 被动对象 - 游戏中的被动效果单位
 * @param objectName 对象名称
 * @param baseClass 基础类别
 * @param description 对象描述
 */
sealed trait PassiveObject {
  def objectName: String
  def baseClass: BaseClass
  def description: String
  
  // 验证被动对象的有效性
  def isValid: Boolean = objectName.nonEmpty
  
  override def toString: String = s"$objectName($baseClass)"
}

/**
 * 饼类被动对象 - 提供能量和伤害倍数
 */
case class CakeObject(
  objectName: String,
  energyGain: Int,
  damageMultiplier: Double,
  description: String = ""
) extends PassiveObject {
  
  override def baseClass: BaseClass = BaseClass.Cake
  
  require(energyGain >= 0, "能量增益不能为负数")
  require(damageMultiplier >= 0, "伤害倍数不能为负数")
  
  override def toString: String = s"$objectName(能量+$energyGain, 伤害×$damageMultiplier)"
}

/**
 * 盾类被动对象 - 提供盾牌效果
 */
case class ShieldObject(
  objectName: String,
  shieldMultiplier: Double,
  description: String = ""
) extends PassiveObject {
  
  override def baseClass: BaseClass = BaseClass.Shield
  
  require(shieldMultiplier >= 0, "盾牌倍数不能为负数")
  
  override def toString: String = s"$objectName(盾牌×$shieldMultiplier)"
}

/**
 * 攻击类型防御对象 - 防御特定攻击类型
 */
case class AttackTypeDefenseObject(
  objectName: String,
  targetAttackTypes: Set[AttackType],
  description: String = ""
) extends PassiveObject {
  
  override def baseClass: BaseClass = BaseClass.TypeDefense
  
  require(targetAttackTypes.nonEmpty, "防御目标不能为空")
  
  // 检查是否能防御指定攻击类型
  def canDefendAgainst(attackType: AttackType): Boolean = targetAttackTypes.contains(attackType)
  
  override def toString: String = s"$objectName(防御${targetAttackTypes.mkString(",")})"
}

/**
 * 基础类别防御对象 - 防御特定基础类别
 */
case class ObjectDefenseObject(
  objectName: String,
  targetObject: AttackObject,
  description: String = ""
) extends PassiveObject {
  
  override def baseClass: BaseClass = BaseClass.ObjectDefense

  def canDefendAgainst(attackObject: AttackObject): Boolean = targetObject == attackObject

  // 检查是否为有效的防御目标
  def isValidDefenseTarget: Boolean = targetObject != null

  override def toString: String = s"$objectName(防御$targetObject)"
}

/**
 * 行动防御对象 - 防御特定行动
 */
case class ActionDefenseObject(
  objectName: String,
  targetAction: ActiveAction,
  description: String = ""
) extends PassiveObject {
  
  override def baseClass: BaseClass = BaseClass.ActionDefense
  
  // 检查是否能防御指定行动
  def canDefendAgainst(target: ActiveAction): Boolean = 
    targetAction == target
  
  override def toString: String = s"$objectName(防御$targetAction)"
}

object PassiveObject {
  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[PassiveObject] = deriveEncoder
  private val circeDecoder: Decoder[PassiveObject] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[PassiveObject] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[PassiveObject] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[PassiveObject]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given passiveObjectEncoder: Encoder[PassiveObject] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given passiveObjectDecoder: Decoder[PassiveObject] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
  
  // 便捷构造函数 - 饼类对象
  def cake(name: String, energyGain: Int, damageMultiplier: Double = 1.0): CakeObject = {
    CakeObject(name, energyGain, damageMultiplier)
  }

  def shield(name: String, shieldMultiplier: Double = 1.0): ShieldObject = {
    ShieldObject(name, shieldMultiplier)
  }
 
  def attackTypeDefense(name: String, attackTypes: AttackType*): AttackTypeDefenseObject = {
    AttackTypeDefenseObject(name, attackTypes.toSet)
  }
  
  // 便捷构造函数 - 基础类别防御
  def objectDefense(name: String, targetObject: AttackObject): ObjectDefenseObject = {
    ObjectDefenseObject(name, targetObject)
  }
  
  // 便捷构造函数 - 行动防御
  def actionDefense(name: String, targetAction: ActiveAction): ActionDefenseObject = {
    ActionDefenseObject(name, targetAction)
  }
  
  // 预定义的常见被动对象
  object Common {
    val BasicDefense = attackTypeDefense("BasicDefense", AttackType.Normal, AttackType.AntiAir)
    val UniversalDefense = attackTypeDefense("UniversalDefense", AttackType.Normal, AttackType.Penetration, AttackType.AntiAir, AttackType.Nuclear)

    val StandardCake = cake("StandardCake", 1, 1.0)
    val PowerCake = cake("PowerCake", 2, 3.0)
    
    val StandardShield = shield("StandardShield")
  }
}