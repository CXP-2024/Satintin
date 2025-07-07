package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import org.slf4j.LoggerFactory

/**
 * 战斗工具类
 */
object BattleUtils {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 应用能量清零规则
   */
  def applyEnergyResetRule(
    player1: PlayerState, 
    player2: PlayerState, 
    p1Damage: Int, 
    p2Damage: Int
  ): (PlayerState, PlayerState) = {
    if (p1Damage > 0 || p2Damage > 0) {
      logger.info("有人扣血，双方能量清零")
      (player1.clearEnergy(), player2.clearEnergy())
    } else {
      (player1, player2)
    }
  }
  
  /**
   * 计算最终能量变化
   */
  def calculateFinalEnergyChange(
    originalEnergy: Int, 
    finalEnergy: Int
  ): Int = {
    finalEnergy - originalEnergy
  }
  
  /**
   * 获取单一行动的基础类别
   */
  def getSingleActionBaseClass(action: ActiveAction): Option[BaseClass] = {
    action match {
      case single: SingleAction if single.getBaseObjects.size == 1 =>
        single.getBaseObjects.headOption.map(_.baseClass)
      case _ => None
    }
  }
  
  /**
   * 根据基础类别过滤攻击
   */
  def filterAttackByClass(active: ActiveAction, targetClass: BaseClass): Map[AttackType, Int] = {
    val filteredAttacks = active.attackObjects.filter { case (attackObj, _) =>
      attackObj.baseClass != targetClass
    }
    
    filteredAttacks.foldLeft(Map.empty[AttackType, Int]) { case (acc, (attackObject, stackCount)) =>
      val attackType = attackObject.attackType
      val damage = attackObject.damage * stackCount
      acc + (attackType -> (acc.getOrElse(attackType, 0) + damage))
    }
  }
}