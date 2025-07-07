package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import org.slf4j.LoggerFactory
import io.circe.Json
import io.circe.generic.auto._

/**
 * 主要战斗解决器 - 协调不同类型的战斗
 */
object BattleResolver {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 解决一轮战斗，接收GameState和两个玩家的action
   */
  def resolveBattle(
    gameState: GameState,
    player1Action: BattleAction,
    player2Action: BattleAction
  ): (GameState, RoundResult) = {
    logger.info(s"开始解决第${gameState.currentRound}轮战斗")
    
    // 记录战斗前的状态，用于后续计算变化
    val stateBeforeBattle = gameState
    val player1 = gameState.player1
    val player2 = gameState.player2
    
    // 根据action类型调用相应的resolver
    val (p1Updated, p2Updated, results) = (player1Action.Action, player2Action.Action) match {
      // 双方都被动
      case (Left(passive1), Left(passive2)) =>
        logger.info("双方都是被动行动")
        PassiveVsPassiveResolver.resolve(player1, player2, passive1, passive2, gameState.currentRound)
      
      // 双方都主动
      case (Right(active1), Right(active2)) =>
        logger.info("双方都是主动行动")
        ActiveVsActiveResolver.resolve(player1, player2, active1, active2, gameState.currentRound)
      
      // 一方主动，一方被动
      case (Right(active), Left(passive)) =>
        logger.info("玩家1主动，玩家2被动")
        ActiveVsPassiveResolver.resolve(player1, player2, active, passive, isPlayer1Active = true, gameState.currentRound)
      
      case (Left(passive), Right(active)) =>
        logger.info("玩家1被动，玩家2主动")
        ActiveVsPassiveResolver.resolve(player1, player2, active, passive, isPlayer1Active = false, gameState.currentRound)
    }
    
    // 创建更新后的GameState
    val updatedGameState = gameState.copy(
      player1 = p1Updated,
      player2 = p2Updated,
      currentRound = gameState.currentRound + 1,
      roundPhase = "action"  // 回合结束后进入下一轮"action"阶段
    )
    
    // 创建回合结果
    val roundResult = createRoundResult(player1Action, player2Action, stateBeforeBattle, updatedGameState)
    
    // 检查游戏是否结束
    val finalGameState = determineGameStatus(updatedGameState)
    
    (finalGameState, roundResult)
  }
  
  /**
   * 创建符合WebSocketModels的回合结果
   */
  def createRoundResult(
    player1Action: BattleAction,
    player2Action: BattleAction,
    stateBeforeBattle: GameState,
    stateAfterBattle: GameState
  ): RoundResult = {
    // 计算状态变化
    val player1HealthChange = stateAfterBattle.player1.health - stateBeforeBattle.player1.health
    val player1EnergyChange = stateAfterBattle.player1.energy - stateBeforeBattle.player1.energy
    val player2HealthChange = stateAfterBattle.player2.health - stateBeforeBattle.player2.health
    val player2EnergyChange = stateAfterBattle.player2.energy - stateBeforeBattle.player2.energy
    
    RoundResult(
      round = stateBeforeBattle.currentRound,
      player1Action = player1Action,
      player2Action = player2Action,
      results = Json.obj(
        "player1" -> Json.obj(
          "healthChange" -> Json.fromInt(player1HealthChange), 
          "energyChange" -> Json.fromInt(player1EnergyChange)
        ),
        "player2" -> Json.obj(
          "healthChange" -> Json.fromInt(player2HealthChange), 
          "energyChange" -> Json.fromInt(player2EnergyChange)
        )
      ),
      cardEffects = List()
    )
  }
  
  /**
   * 确定游戏状态，检查是否有胜者
   */
  def determineGameStatus(gameState: GameState): GameState = {
    val player1 = gameState.player1
    val player2 = gameState.player2
    
    if (player1.health <= 0 || player2.health <= 0) {
      val winner = if (player1.health <= 0 && player2.health <= 0) {
        if (player1.health == player2.health) None // 平局
        else if (player1.health > player2.health) Some(player1.username)
        else Some(player2.username)
      } else if (player1.health <= 0) {
        Some(player2.username)
      } else {
        Some(player1.username)
      }
      
      gameState.copy(
        roundPhase = "finished",
        winner = winner
      )
    } else {
      gameState.copy(player1 = player1.copy(currentAction = None, remainingTime = 60, hasActed = false),
                     player2 = player2.copy(currentAction = None, remainingTime = 60, hasActed = false)) // 继续游戏，
    }
  }
}