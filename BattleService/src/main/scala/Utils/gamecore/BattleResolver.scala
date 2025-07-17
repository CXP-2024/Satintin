package Utils.gamecore

import Objects.BattleService.*
import Objects.BattleService.core.*
import Utils.gamecore.BattleConstants.EXPLOSION_DAMAGE
import org.slf4j.LoggerFactory
import io.circe.Json
import io.circe.generic.auto.*
import Utils.gamecore.ExplosionHandler
import io.circe.syntax._
import scala.util.Random
import Utils.gamecore.{clearPlayerEnergy, modifyPlayerEnergy, modifyPlayerHealth}
/*

/**
 * 主要战斗解决器 - 协调不同类型的战斗
 */
case class BattleResolver(
  gameState: GameState,
  player1Action: BattleAction,
  player2Action: BattleAction
) {
  private val logger = LoggerFactory.getLogger(getClass)

  // 记录战斗前的状态
  lazy val stateBeforeBattle: GameState = gameState
  
  // 检查爆点
  lazy val explosionResult: ExplosionHandler.ExplosionResult = {
    logger.info(s"开始解决第${gameState.currentRound}轮战斗")
    ExplosionHandler.checkExplosions(gameState, player1Action, player2Action)
  }

  // 基于爆点结果的初始玩家状态
  lazy val initialUpdatedPlayers: (PlayerState, PlayerState) = {
    (explosionResult.updatedPlayer1, explosionResult.updatedPlayer2)
  }

  // 正常战斗解析结果（仅在无爆点时计算）
  lazy val battleResolution: Option[(PlayerState, PlayerState, Json)] = {
    if (!explosionResult.hasExploded) {
      logger.info("无爆点，进行正常战斗解析")
      
      val (initialP1, initialP2) = initialUpdatedPlayers
      
      // 根据action类型调用相应的resolver
      val result = (player1Action.Action, player2Action.Action) match {
        // 双方都被动
        case (Left(passive1), Left(passive2)) =>
          logger.info("双方都是被动行动")
          PassiveVsPassiveResolver(initialP1, initialP2, passive1, passive2, gameState.currentRound).result
        
        // 双方都主动
        case (Right(active1), Right(active2)) =>
          logger.info("双方都是主动行动")
          ActiveVsActiveResolver(initialP1, initialP2, active1, active2, gameState.currentRound).result
        
        // 一方主动，一方被动
        case (Right(active), Left(passive)) =>
          logger.info("玩家1主动，玩家2被动")
          ActiveVsPassiveResolver(initialP1, initialP2, active, passive, isPlayer1Active = true, gameState.currentRound).result
        
        case (Left(passive), Right(active)) =>
          logger.info("玩家1被动，玩家2主动")
          ActiveVsPassiveResolver(initialP1, initialP2, active, passive, isPlayer1Active = false, gameState.currentRound).result
      }
      
      Some(result)
    } else {
      logger.info("检测到爆点，跳过正常结算")
      None
    }
  }

  // 应用卡牌效果后的玩家状态
  lazy val playersAfterCardEffects: (PlayerState, PlayerState, List[CardEffect]) = {
    battleResolution match {
      case Some((p1Updated, p2Updated, _)) =>
        // 应用卡牌效果
        val cardEffectResult = CardEffectManager.applyCardEffects(
          p1Updated, p2Updated, player1Action, player2Action
        )
        (cardEffectResult.updatedPlayer1, cardEffectResult.updatedPlayer2, cardEffectResult.triggeredEffects)
      
      case None =>
        // 爆点情况下，使用爆点后的状态，无卡牌效果
        val (p1, p2) = initialUpdatedPlayers
        (p1, p2, List.empty[CardEffect])
    }
  }

  // 更新后的游戏状态
  lazy val updatedGameState: GameState = {
    val (finalP1, finalP2, _) = playersAfterCardEffects
    
    gameState.copy(
      player1 = finalP1,
      player2 = finalP2,
      currentRound = gameState.currentRound + 1,
      roundPhase = "action"  // 回合结束后进入下一轮"action"阶段
    )
  }

  // 回合结果
  lazy val roundResult: RoundResult = {
    val (_, _, cardEffects) = playersAfterCardEffects
    
    battleResolution match {
      case Some((_, _, battleResultsJson)) =>
        // 正常战斗的回合结果
        createRoundResult(player1Action, player2Action, stateBeforeBattle, updatedGameState, cardEffects)
      
      case None =>
        // 爆点情况的回合结果
        RoundResult(
          round = gameState.currentRound,
          player1Action = player1Action,
          player2Action = player2Action,
          results = explosionResult.resultsJson,
          cardEffects = List()  // 爆点情况下没有卡牌效果
        )
    }
  }

  // 最终游戏状态（检查胜负）
  lazy val finalGameState: GameState = {
    determineGameStatus(updatedGameState)
  }

  // 最终结果
  lazy val result: (GameState, RoundResult) = {
    (finalGameState, roundResult)
  }

  // 私有辅助方法：创建回合结果
  private def createRoundResult(
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

  // 私有辅助方法：确定游戏状态
  private def determineGameStatus(gameState: GameState): GameState = {
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
      gameState.copy(
        player1 = player1.copy(currentAction = None, remainingTime = 60, hasActed = false),
        player2 = player2.copy(currentAction = None, remainingTime = 60, hasActed = false)
      ) // 继续游戏
    }
  }
}
*/
def BattleResolver(gameState: GameState, player1Action: BattleAction, player2Action: BattleAction): (GameState,RoundResult)= {
  val logger = LoggerFactory.getLogger(getClass)

  // 记录战斗前的状态
  val stateBeforeBattle: GameState = gameState

  // 检查爆点
  val explosionResult: ExplosionHandler.ExplosionResult = {
    logger.info(s"开始解决第${gameState.currentRound}轮战斗")
    ExplosionHandler.checkExplosions(gameState, player1Action, player2Action)
  }
 
  // 基于爆点结果的初始玩家状态
  val initialUpdatedPlayers: (PlayerState, PlayerState) = {
    (explosionResult.updatedPlayer1, explosionResult.updatedPlayer2)
  }

  if (!explosionResult.hasExploded) {
    val playerEnergyDealer = getEnergyDealer(player1Action,player2Action)
    val gameState1 = playerEnergyDealer(gameState)
    
    val playerDamageDealer = getDamageDealer(player1Action,player2Action)
    val gameState2 = playerDamageDealer(gameState1)
    
    // 应用卡牌效果
    val cardEffectResult = Utils.gamecore.processCardEffects(gameState2)
    val gameState3 = cardEffectResult.updatedGameState
    val cardEffects = cardEffectResult.triggeredEffects
    
    // 检查是否有扣血，如果有则清零能量
    val gameState3WithEnergyReset = resetEnergyIfDamaged(gameState, gameState3)
    
    val gameState4 = updateGameState(gameState3WithEnergyReset)
    
    val roundResult = getRoundResult(gameState, gameState4, player1Action, player2Action, cardEffects)
    
    val gameState5 = determineGameStatus(gameState4)

    (gameState5, roundResult)
    
  } else {
    logger.info("检测到爆点，跳过正常结算")
    val gameStateupdated = updateGameState(gameState)
    val gameStatefinal = determineGameStatus(gameStateupdated)
    
    
    val roundResult = RoundResult(
      round = gameState.currentRound,
      player1Action = player1Action,
      player2Action = player2Action,
      results = explosionResult.resultsJson,
      cardEffects = List()  // 爆点情况下没有卡牌效果
    )
    (gameStatefinal,roundResult)
  }
}

/**
 * 检查是否有玩家扣血，如果有则清零双方能量
 * @param stateBeforeBattle 战斗前的游戏状态
 * @param stateAfterBattle 战斗后的游戏状态
 * @return 处理后的游戏状态
 */
def resetEnergyIfDamaged(stateBeforeBattle: GameState, stateAfterBattle: GameState): GameState = {
  val logger = LoggerFactory.getLogger(getClass)
  
  // 检查是否有玩家受到伤害
  val player1Damaged = stateAfterBattle.player1.health < stateBeforeBattle.player1.health
  val player2Damaged = stateAfterBattle.player2.health < stateBeforeBattle.player2.health
  
  if (player1Damaged || player2Damaged) {
    logger.info("检测到有玩家受到伤害，清零双方能量")
    // 使用纯函数式方法清零双方能量
    stateAfterBattle.copy(
      player1 = clearPlayerEnergy(stateAfterBattle.player1),
      player2 = clearPlayerEnergy(stateAfterBattle.player2)
    )
  } else {
    // 无伤害，不做改变
    stateAfterBattle
  }
}

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
    gameState.copy(
      player1 = player1.copy(currentAction = None, remainingTime = 60, hasActed = false),
      player2 = player2.copy(currentAction = None, remainingTime = 60, hasActed = false)
    ) // 继续游戏
  }
}
def updateGameState(gameState: GameState): GameState = {

  gameState.copy(
    currentRound = gameState.currentRound + 1,
    roundPhase = "action" // 回合结束后进入下一轮"action"阶段
  )
}

def getRoundResult(
                      stateBeforeBattle: GameState,
                      stateAfterBattle: GameState,
                      player1Action: BattleAction,
                      player2Action: BattleAction,
                      cardEffects: List[CardEffect] = List()
                    ): RoundResult = {
  // 计算状态变化
  val player1EnergyChange = -stateBeforeBattle.player1.energy + stateAfterBattle.player1.energy
  val player2EnergyChange = -stateBeforeBattle.player2.energy + stateAfterBattle.player2.energy
  val player1HealthChange = -stateBeforeBattle.player1.health + stateAfterBattle.player1.health
  val player2HealthChange = -stateBeforeBattle.player2.health + stateAfterBattle.player2.health

  RoundResult(
    stateBeforeBattle.currentRound,
    player1Action,
    player2Action,
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
