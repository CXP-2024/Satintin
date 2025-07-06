package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import org.slf4j.LoggerFactory

/**
 * 主要战斗解决器 - 协调不同类型的战斗
 */
object BattleResolver {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 解决一轮战斗
   */
  def resolveBattle(player1: PlayerState, player2: PlayerState, roundNumber: Int): (PlayerState, PlayerState, RoundResult) = {
    logger.info(s"开始解决第${roundNumber}轮战斗")
    
    (player1.currentAction, player2.currentAction) match {
      // 双方都被动
      case (Some(Left(passive1)), Some(Left(passive2))) =>
        logger.info("双方都是被动行动")
        PassiveVsPassiveResolver.resolve(player1, player2, passive1, passive2, roundNumber)
      
      // 双方都主动
      case (Some(Right(active1)), Some(Right(active2))) =>
        logger.info("双方都是主动行动")
        ActiveVsActiveResolver.resolve(player1, player2, active1, active2, roundNumber)
      
      // 一方主动，一方被动
      case (Some(Right(active)), Some(Left(passive))) =>
        logger.info("玩家1主动，玩家2被动")
        ActiveVsPassiveResolver.resolve(player1, player2, active, passive, isPlayer1Active = true, roundNumber)
      
      case (Some(Left(passive)), Some(Right(active))) =>
        logger.info("玩家1被动，玩家2主动")
        ActiveVsPassiveResolver.resolve(player1, player2, active, passive, isPlayer1Active = false, roundNumber)
      
      case _ =>
        logger.warn("有玩家没有提交行动")
        (player1, player2, RoundResult(roundNumber, None, None, 0, 0, 0, 0, false))
    }
  }
  
  /**
   * 检查爆点
   */
  def checkExplosion(player1: PlayerState, player2: PlayerState, roundNumber: Int): (PlayerState, PlayerState, RoundResult) = {
    val p1Exploded = player1.wouldExplode
    val p2Exploded = player2.wouldExplode
    
    if (p1Exploded || p2Exploded) {
      logger.warn(s"第${roundNumber}轮有玩家爆点! P1:${p1Exploded}, P2:${p2Exploded}")
      
      val p1After = if (p1Exploded) player1.takeDamage(BattleConstants.EXPLOSION_DAMAGE) else player1
      val p2After = if (p2Exploded) player2.takeDamage(BattleConstants.EXPLOSION_DAMAGE) else player2
      
      val explodedPlayer = if (p1Exploded && p2Exploded) Some("both")
                          else if (p1Exploded) Some(player1.playerId)
                          else Some(player2.playerId)
      
      val result = RoundResult(
        roundNumber = roundNumber,
        player1Action = player1.currentAction,
        player2Action = player2.currentAction,
        player1DamageTaken = if (p1Exploded) BattleConstants.EXPLOSION_DAMAGE else 0,
        player2DamageTaken = if (p2Exploded) BattleConstants.EXPLOSION_DAMAGE else 0,
        player1EnergyChange = -player1.energy,
        player2EnergyChange = -player2.energy,
        explosionOccurred = true,
        explodedPlayer = explodedPlayer
      )
      
      (p1After.clearEnergy(), p2After.clearEnergy(), result)
    } else {
      (player1, player2, RoundResult(roundNumber, None, None, 0, 0, 0, 0, false))
    }
  }
  
  /**
   * 确定游戏状态
   */
  def determineGameStatus(player1: PlayerState, player2: PlayerState): GameStatus = {
    if (player1.health <= 0 && player2.health <= 0) {
      if (player1.health == player2.health) GameStatus.Draw
      else if (player1.health > player2.health) GameStatus.Player1Win
      else GameStatus.Player2Win
    } else if (player1.health <= 0) {
      GameStatus.Player2Win
    } else if (player2.health <= 0) {
      GameStatus.Player1Win
    } else {
      GameStatus.InProgress
    }
  }
}