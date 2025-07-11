package Utils.gamecore

import Objects.BattleService.*
import Objects.BattleService.core.*
import Utils.gamecore.BattleConstants.EXPLOSION_DAMAGE
import org.slf4j.LoggerFactory
import io.circe.Json
import io.circe.generic.auto.*
import Utils.gamecore.ExplosionHandler
import io.circe.syntax._
import org.slf4j.LoggerFactory
import scala.util.Random


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
    
    // 检查玩家是否爆点
    val explosionResult = ExplosionHandler.checkExplosions(gameState, player1Action, player2Action)
    
    // 基于爆点结果更新玩家状态
    var updatedPlayer1 = explosionResult.updatedPlayer1
    var updatedPlayer2 = explosionResult.updatedPlayer2
    var resultsJson = explosionResult.resultsJson
    
    // 如果没有爆点，进行正常战斗解析
    if (!explosionResult.hasExploded) {
      logger.info("无爆点，进行正常战斗解析")
      
      // 根据action类型调用相应的resolver
      val (p1Updated, p2Updated, results) = (player1Action.Action, player2Action.Action) match {
        // 双方都被动
        case (Left(passive1), Left(passive2)) =>
          logger.info("双方都是被动行动")
          PassiveVsPassiveResolver.resolve(updatedPlayer1, updatedPlayer2, passive1, passive2, gameState.currentRound)
        
        // 双方都主动
        case (Right(active1), Right(active2)) =>
          logger.info("双方都是主动行动")
          ActiveVsActiveResolver.resolve(updatedPlayer1, updatedPlayer2, active1, active2, gameState.currentRound)
        
        // 一方主动，一方被动
        case (Right(active), Left(passive)) =>
          logger.info("玩家1主动，玩家2被动")
          ActiveVsPassiveResolver.resolve(updatedPlayer1, updatedPlayer2, active, passive, isPlayer1Active = true, gameState.currentRound)
        
        case (Left(passive), Right(active)) =>
          logger.info("玩家1被动，玩家2主动")
          ActiveVsPassiveResolver.resolve(updatedPlayer1, updatedPlayer2, active, passive, isPlayer1Active = false, gameState.currentRound)
      }
      
      // 更新玩家状态
      updatedPlayer1 = p1Updated
      updatedPlayer2 = p2Updated
      
      // 应用卡牌效果
      val cardEffectResult = CardEffectManager.applyCardEffects(
        updatedPlayer1, updatedPlayer2, player1Action, player2Action
      )
      
      // 更新玩家状态
      updatedPlayer1 = cardEffectResult.updatedPlayer1
      updatedPlayer2 = cardEffectResult.updatedPlayer2
      val triggeredCardEffects = cardEffectResult.triggeredEffects
      
      // 创建更新后的GameState
      val updatedGameState = gameState.copy(
        player1 = updatedPlayer1,
        player2 = updatedPlayer2,
        currentRound = gameState.currentRound + 1,
        roundPhase = "action"  // 回合结束后进入下一轮"action"阶段
      )
      
      // 创建回合结果，包含触发的卡牌效果
      val roundResult = createRoundResult(
        player1Action, player2Action, stateBeforeBattle, updatedGameState, triggeredCardEffects
      )
      
      // 检查游戏是否结束
      val finalGameState = determineGameStatus(updatedGameState)
      
      (finalGameState, roundResult)
    } else {
      logger.info("检测到爆点，跳过正常结算")
      // 爆点情况下使用爆点结果
      val updatedGameState = gameState.copy(
        player1 = updatedPlayer1,
        player2 = updatedPlayer2,
        currentRound = gameState.currentRound + 1,
        roundPhase = "action"
      )
      val finalGameState = determineGameStatus(updatedGameState)


      (finalGameState, RoundResult(
        round = gameState.currentRound,
        player1Action = player1Action,
        player2Action = player2Action,
        results = resultsJson,
        cardEffects = List()  // 爆点情况下没有卡牌效果
      ))
    }
  }
  
  /**
   * 创建符合WebSocketModels的回合结果
   */
  def createRoundResult(
    player1Action: BattleAction,
    player2Action: BattleAction,
    stateBeforeBattle: GameState,
    stateAfterBattle: GameState,
    cardEffects: List[CardEffect] = List()
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
      cardEffects = cardEffects
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
