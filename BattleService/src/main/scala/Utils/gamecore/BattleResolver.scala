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
