package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import org.slf4j.LoggerFactory

/**
 * 主动行动对被动行动的战斗解决器
 */
object ActiveVsPassiveResolver {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 解决主动vs被动的战斗
   */
  def resolve(
    player1: PlayerState, 
    player2: PlayerState, 
    active: ActiveAction,
    passive: PassiveAction,
    isPlayer1Active: Boolean,
    roundNumber: Int
  ): (PlayerState, PlayerState, RoundResult) = {
    
    logger.info(s"解决主动vs被动战斗: ${if (isPlayer1Active) "P1主动P2被动" else "P1被动P2主动"}")
    
    // 直接传入主动行动进行计算
    val (passiveDamage, activeDamage) = PassiveDamageCalculator.calculateDamage(active, passive)
    logger.info(s"伤害计算: 被动方受到${passiveDamage}伤害, 主动方受到${activeDamage}伤害")
    
    val (p1Damage, p2Damage) = if (isPlayer1Active) {
      (activeDamage, passiveDamage)
    } else {
      (passiveDamage, activeDamage)
    }
    
    // 被动方的能量变化
    val passiveEnergyChange = passive.passiveObject match {
      case cake: CakeObject => 
        logger.info(s"饼类被动，能量增益: ${cake.energyGain}")
        cake.energyGain
      case _: ShieldObject => 
        val energyLoss = if (isPlayer1Active) player2.energy else player1.energy
        logger.info(s"盾类被动，消耗所有能量: ${energyLoss}")
        -energyLoss
      case _ => 
        logger.info("其他被动类型，无能量变化")
        0
    }
    
    // 主动方消耗能量
    val activeEnergyChange = -active.getTotalEnergyCost
    logger.info(s"主动方消耗能量: ${active.getTotalEnergyCost}")
    
    val (p1EnergyChange, p2EnergyChange) = if (isPlayer1Active) {
      (activeEnergyChange, passiveEnergyChange)
    } else {
      (passiveEnergyChange, activeEnergyChange)
    }
    
    val p1After = player1.takeDamage(p1Damage).copy(energy = math.max(0, player1.energy + p1EnergyChange))
    val p2After = player2.takeDamage(p2Damage).copy(energy = math.max(0, player2.energy + p2EnergyChange))
    
    // 如果有人扣血，双方能量清零
    val (p1Final, p2Final) = if (p1Damage > 0 || p2Damage > 0) {
      logger.info("有人扣血，双方能量清零")
      (p1After.clearEnergy(), p2After.clearEnergy())
    } else {
      (p1After, p2After)
    }
    
    val result = RoundResult(
      roundNumber = roundNumber,
      player1Action = if (isPlayer1Active) Some(Right(active)) else Some(Left(passive)),
      player2Action = if (isPlayer1Active) Some(Left(passive)) else Some(Right(active)),
      player1DamageTaken = p1Damage,
      player2DamageTaken = p2Damage,
      player1EnergyChange = p1Final.energy - player1.energy,
      player2EnergyChange = p2Final.energy - player2.energy,
      explosionOccurred = false
    )
    
    (p1Final, p2Final, result)
  }
}