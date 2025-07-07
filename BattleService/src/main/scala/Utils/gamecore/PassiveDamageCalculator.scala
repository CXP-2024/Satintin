package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import org.slf4j.LoggerFactory

/**
 * 被动行动伤害计算器
 */
object PassiveDamageCalculator {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 计算主动vs被动的伤害
   * @param active 主动行动
   * @param passive 被动行动
   * @return (被动方受到的伤害, 主动方受到的伤害)
   */
  def calculateDamage(active: ActiveAction, passive: PassiveAction): (Int, Int) = {
    // 根据被动行动的具体类型计算伤害
    passive.passiveObject match {
      case cake: CakeObject =>
        calculateCakeDamage(active, cake)
      
      case shield: ShieldObject =>
        calculateShieldDamage(active, shield)
      
      case attackTypeDefense: AttackTypeDefenseObject =>
        calculateAttackTypeDefenseDamage(active, attackTypeDefense)
      
      case objectDefense: ObjectDefenseObject =>
        calculateObjectDefenseDamage(active, objectDefense)
      
      case actionDefense: ActionDefenseObject =>
        calculateActionDefenseDamage(active, actionDefense)
      
      case _ =>
        logger.warn(s"未知的被动对象类型: ${passive.passiveObject.getClass.getSimpleName}")
        val totalAttack = active.getTotalAttack
        (totalAttack.values.sum, 0)
    }
  }
  
  /**
   * 计算饼类被动的伤害
   */
  private def calculateCakeDamage(active: ActiveAction, cake: CakeObject): (Int, Int) = {
    val totalAttack = active.getTotalAttack
    val baseDamage = totalAttack.getOrElse(AttackType.Normal, 0) + 
                    totalAttack.getOrElse(AttackType.Penetration, 0) + 
                    totalAttack.getOrElse(AttackType.AntiAir, 0)
    val damage = (baseDamage * cake.damageMultiplier).toInt
    
    logger.info(s"饼类被动伤害计算: 基础伤害${baseDamage} × 倍数${cake.damageMultiplier} = ${damage}")
    (damage, 0)
  }
  
  /**
   * 计算攻击类型防御的伤害
   */
  private def calculateAttackTypeDefenseDamage(active: ActiveAction, defense: AttackTypeDefenseObject): (Int, Int) = {
    val totalAttack = active.getTotalAttack
    val defendedDamage = totalAttack.filter { case (attackType, _) => 
      defense.canDefendAgainst(attackType) 
    }.values.sum
    val undefendedDamage = totalAttack.values.sum - defendedDamage
    
    logger.info(s"攻击类型防御: 防御了${defendedDamage}伤害, 剩余${undefendedDamage}伤害")
    (undefendedDamage, 0)
  }
  
  /**
   * 计算盾类被动的伤害
   */
  private def calculateShieldDamage(active: ActiveAction, shield: ShieldObject): (Int, Int) = {
    val totalAttack = active.getTotalAttack
    val passiveDamage = (totalAttack.getOrElse(AttackType.Nuclear, 0) + 
                        totalAttack.getOrElse(AttackType.AntiAir, 0)) * shield.shieldMultiplier
    val activeDamage = totalAttack.getOrElse(AttackType.Normal, 0) + 
                      totalAttack.getOrElse(AttackType.Penetration, 0)
    
    logger.info(s"盾类被动: 被动方受到${passiveDamage.toInt}伤害, 主动方受到${activeDamage}伤害")
    (passiveDamage.toInt, activeDamage)
  }
  
  /**
   * 计算对象防御的伤害
   */
  private def calculateObjectDefenseDamage(active: ActiveAction, defense: ObjectDefenseObject): (Int, Int) = {
    val defendedDamage = active.attackObjects.filter { case (attackObj, _) =>
      defense.canDefendAgainst(attackObj)
    }.map { case (attackObj, stackCount) =>
      attackObj.damage * stackCount
    }.sum
    
    val totalAttack = active.getTotalAttack
    val totalDamage = totalAttack.values.sum
    val passiveDamage = totalDamage - defendedDamage
    
    logger.info(s"对象防御: 防御了${defendedDamage}伤害, 剩余${passiveDamage}伤害")
    (passiveDamage, 0)
  }
  
  /**
   * 计算行动防御的伤害
   */
  private def calculateActionDefenseDamage(active: ActiveAction, defense: ActionDefenseObject): (Int, Int) = {
    val damage = if (defense.canDefendAgainst(active)) {
      logger.info("行动防御生效，伤害为0")
      0
    } else {
      val totalAttack = active.getTotalAttack
      val totalDamage = totalAttack.values.sum
      logger.info(s"行动防御不生效，受到${totalDamage}伤害")
      totalDamage
    }
    (damage, 0)
  }
}