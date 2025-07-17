package Utils.gamecore

import Objects.BattleService.*
import Objects.BattleService.core.*
import org.slf4j.LoggerFactory
import io.circe.Json
import io.circe.syntax._

/**
 * 战斗处理函数 - 纯函数式方法
 */

private val logger = LoggerFactory.getLogger(classOf[GameState])

/**
 * 获取能量处理函数
 * @param player1Action 玩家1的行动
 * @param player2Action 玩家2的行动
 * @return 一个处理能量变化的GameState => GameState函数
 */
def getEnergyDealer(player1Action: BattleAction, player2Action: BattleAction): GameState => GameState = {
  gameState => {
    logger.info(s"处理第${gameState.currentRound}轮能量变化")
    
    // 根据action类型处理能量消耗和获取
    (player1Action.Action, player2Action.Action) match {
      // 双方都被动
      case (Left(passive1), Left(passive2)) =>
        logger.info("能量处理: 双方都是被动行动")
        val (p1, p2, _) = resolveEnergyPassiveVSPassive(
          gameState.player1, gameState.player2, passive1, passive2, gameState.currentRound
        )
        gameState.copy(player1 = p1, player2 = p2)
      
      // 双方都主动
      case (Right(active1), Right(active2)) =>
        logger.info("能量处理: 双方都是主动行动")
        val (p1, p2, _) = resolveEnergyActiveVSActive(
          gameState.player1, gameState.player2, active1, active2, gameState.currentRound
        )
        gameState.copy(player1 = p1, player2 = p2)
      
      // 玩家1主动，玩家2被动
      case (Right(active), Left(passive)) =>
        logger.info("能量处理: 玩家1主动，玩家2被动")
        val (p1, p2, _) = resolveEnergyActiveVSPassive(
          gameState.player1, gameState.player2, active, passive, isPlayer1Active = true, gameState.currentRound
        )
        gameState.copy(player1 = p1, player2 = p2)
      
      // 玩家1被动，玩家2主动
      case (Left(passive), Right(active)) =>
        logger.info("能量处理: 玩家1被动，玩家2主动")
        val (p1, p2, _) = resolveEnergyActiveVSPassive(
          gameState.player1, gameState.player2, active, passive, isPlayer1Active = false, gameState.currentRound
        )
        gameState.copy(player1 = p1, player2 = p2)
    }
  }
}

/**
 * 获取伤害处理函数
 * @param player1Action 玩家1的行动
 * @param player2Action 玩家2的行动
 * @return 一个处理伤害的GameState => GameState函数
 */
def getDamageDealer(player1Action: BattleAction, player2Action: BattleAction): GameState => GameState = {
  gameState => {
    logger.info(s"处理第${gameState.currentRound}轮伤害计算")
    
    // 根据action类型处理战斗伤害
    (player1Action.Action, player2Action.Action) match {
      // 双方都被动
      case (Left(passive1), Left(passive2)) =>
        logger.info("伤害处理: 双方都是被动行动")
        val (p1, p2, battleResultJson) = resolveDamagePassiveVSPassive(
          gameState.player1, gameState.player2, passive1, passive2, gameState.currentRound
        )
        gameState.copy(player1 = p1, player2 = p2)
      
      // 双方都主动
      case (Right(active1), Right(active2)) =>
        logger.info("伤害处理: 双方都是主动行动")
        val (p1, p2, battleResultJson) = resolveDamageActiveVSActive(
          gameState.player1, gameState.player2, active1, active2, gameState.currentRound
        )
        gameState.copy(player1 = p1, player2 = p2)
      
      // 玩家1主动，玩家2被动
      case (Right(active), Left(passive)) =>
        logger.info("伤害处理: 玩家1主动，玩家2被动")
        val (p1, p2, battleResultJson) = resolveDamageActiveVSPassive(
          gameState.player1, gameState.player2, active, passive, isPlayer1Active = true, gameState.currentRound
        )
        gameState.copy(player1 = p1, player2 = p2)
      
      // 玩家1被动，玩家2主动
      case (Left(passive), Right(active)) =>
        logger.info("伤害处理: 玩家1被动，玩家2主动")
        val (p1, p2, battleResultJson) = resolveDamageActiveVSPassive(
          gameState.player1, gameState.player2, active, passive, isPlayer1Active = false, gameState.currentRound
        )
        gameState.copy(player1 = p1, player2 = p2)
    }
  }
}

/**
 * 组合多个游戏状态处理函数
 * @param handlers 要组合的处理函数列表
 * @return 组合后的函数
 */
def composeHandlers(handlers: List[GameState => GameState]): GameState => GameState = {
  handlers.foldLeft[GameState => GameState](identity)(_ andThen _)
} 

/**
 * 修改玩家能量的纯函数
 * @param change 能量变化值
 * @return 一个将能量变化应用到玩家状态的函数
 */
def modifyPlayerEnergy(change: Int): PlayerState => PlayerState = {
  player => player.copy(energy = math.max(0, player.energy + change))
}

/**
 * 修改玩家生命值的纯函数
 * @param change 生命值变化值
 * @return 一个将生命值变化应用到玩家状态的函数
 */
def modifyPlayerHealth(change: Int): PlayerState => PlayerState = {
  player => player.copy(health = player.health + change)
}

/**
 * 消耗玩家能量的纯函数
 * @param amount 要消耗的能量值
 * @return 一个消耗玩家能量的函数
 */
def consumePlayerEnergy(amount: Int): PlayerState => PlayerState = {
  modifyPlayerEnergy(-amount)
}

/**
 * 清空玩家能量的纯函数                  
 * @return 一个清空玩家能量的函数
 */
def clearPlayerEnergy: PlayerState => PlayerState = {
  player => player.copy(energy = 0)
}


