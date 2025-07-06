package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import org.slf4j.LoggerFactory

/**
 * 被动行动对被动行动的战斗解决器
 */
object PassiveVsPassiveResolver {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 解决被动vs被动的战斗
   */
  def resolve(
    player1: PlayerState, 
    player2: PlayerState, 
    passive1: PassiveAction,
    passive2: PassiveAction,
    roundNumber: Int
  ): (PlayerState, PlayerState, RoundResult) = {
    
    logger.info(s"解决被动vs被动: ${passive1.passiveObject.getClass.getSimpleName} vs ${passive2.passiveObject.getClass.getSimpleName}")
    
    val p1EnergyChange = calculatePassiveEnergyChange(passive1, player1)
    val p2EnergyChange = calculatePassiveEnergyChange(passive2, player2)
    
    logger.info(s"能量变化: P1:${p1EnergyChange}, P2:${p2EnergyChange}")
    
    val p1After = player1.copy(energy = math.max(0, player1.energy + p1EnergyChange))
    val p2After = player2.copy(energy = math.max(0, player2.energy + p2EnergyChange))
    
    val result = RoundResult(
      roundNumber = roundNumber,
      player1Action = Some(Left(passive1)),
      player2Action = Some(Left(passive2)),
      player1DamageTaken = 0,
      player2DamageTaken = 0,
      player1EnergyChange = p1EnergyChange,
      player2EnergyChange = p2EnergyChange,
      explosionOccurred = false
    )
    
    (p1After, p2After, result)
  }
  
  /**
   * 计算被动行动的能量变化
   */
  private def calculatePassiveEnergyChange(passive: PassiveAction, player: PlayerState): Int = {
    passive.passiveObject match {
      case cake: CakeObject => 
        logger.info(s"饼类行动，能量增益: ${cake.energyGain}")
        cake.energyGain
      case _: ShieldObject => 
        logger.info(s"盾类行动，消耗所有能量: ${player.energy}")
        -player.energy
      case _ => 
        logger.info("其他被动行动，无能量变化")
        0
    }
  }
}