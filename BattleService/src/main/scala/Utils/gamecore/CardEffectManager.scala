package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import io.circe.Json
import io.circe.syntax._
import org.slf4j.LoggerFactory
import scala.util.Random

/**
 * 卡牌效果管理 - 纯函数式实现
 */

private val logger = LoggerFactory.getLogger(this.getClass)
private val random = new Random()

/**
 * 卡牌效果结果
 * @param updatedGameState 更新后的游戏状态
 * @param triggeredEffects 触发的卡牌效果列表
 */
case class CardEffectResult(
  updatedGameState: GameState,
  triggeredEffects: List[CardEffect]
)

/**
 * 应用卡牌效果 - 作为纯函数，将游戏状态转换为新状态
 * @param gameState 当前游戏状态
 * @return 应用卡牌效果后的游戏状态
 */
def applyCardEffects(gameState: GameState): GameState = {
  logger.info(s"开始应用卡牌效果")
  val result = processCardEffects(gameState)
  result.updatedGameState
}

/**
 * 处理卡牌效果并返回结果
 * @param gameState 当前游戏状态
 * @return 卡牌效果结果
 */
def processCardEffects(gameState: GameState): CardEffectResult = {
  // 分别处理玩家1和玩家2的卡牌效果
  val player1EffectResult = processPlayerCards(gameState, isPlayer1 = true)
  // 使用player1处理后的结果继续处理player2
  val player2EffectResult = processPlayerCards(player1EffectResult.updatedGameState, isPlayer1 = false)
  
  // 合并两次处理的效果
  CardEffectResult(
    updatedGameState = player2EffectResult.updatedGameState,
    triggeredEffects = player1EffectResult.triggeredEffects ++ player2EffectResult.triggeredEffects
  )
}

/**
 * 处理单个玩家的所有卡牌效果
 * @param gameState 当前游戏状态
 * @param isPlayer1 是否处理玩家1
 * @return 卡牌效果结果
 */
private def processPlayerCards(gameState: GameState, isPlayer1: Boolean): CardEffectResult = {
  // 获取当前玩家和对手
  val (player, opponent) = if (isPlayer1) {
    (gameState.player1, gameState.player2)
  } else {
    (gameState.player2, gameState.player1)
  }
  
  // 使用fold操作处理所有卡牌效果
  val initial = CardEffectResult(gameState, List.empty[CardEffect])
  
  player.cards.foldLeft(initial) { (result, card) =>
    // 检查是否触发效果（基于概率）
    if (random.nextDouble() < card.effectChance) {
      val effect = CardEffect(
        playerId = player.playerId,
        cardName = card.name,
        effectType = card.`type`,
        triggered = true
      )
      logger.info(s"玩家 ${player.username} 的卡牌 ${card.name} 触发效果: ${card.`type`}")
      
      // 应用单个卡牌效果并更新结果
      val updatedGameState = applyCardEffect(card, result.updatedGameState, isPlayer1)
      CardEffectResult(
        updatedGameState = updatedGameState,
        triggeredEffects = result.triggeredEffects :+ effect
      )
    } else {
      // 未触发效果，保持原状态
      result
    }
  }
}

/**
 * 应用单个卡牌效果
 * @param card 要应用效果的卡牌
 * @param gameState 当前游戏状态
 * @param isPlayer1 是否为玩家1的卡牌
 * @return 更新后的游戏状态
 */
private def applyCardEffect(card: CardState, gameState: GameState, isPlayer1: Boolean): GameState = {
  // 获取当前玩家和对手
  val (player, opponent) = if (isPlayer1) {
    (gameState.player1, gameState.player2)
  } else {
    (gameState.player2, gameState.player1)
  }
  
  // 根据卡牌类型应用效果
  val (updatedPlayer, updatedOpponent) = card.`type` match {
    case "穿透" => // 穿透效果：额外造成1点伤害
      logger.info(s"应用穿透效果：${card.name}")
      (player, opponent.takeDamage(1))
      
    case "发育" => // 发育效果：获得1点能量
      logger.info(s"应用发育效果：${card.name}")
      val updatedPlayer = player.copy(energy = math.min(player.energy + 1, BattleConstants.MAX_ENERGY))
      (updatedPlayer, opponent)
      
    case "反弹" => // 反弹效果：对手受到其造成伤害的一部分反弹
      logger.info(s"应用反弹效果：${card.name}")
      val damageToReflect = calculateDamageToReflect(opponent.currentAction)
      (player, opponent.takeDamage(damageToReflect))
      
    case _ =>
      logger.warn(s"未知卡牌效果类型：${card.`type`}")
      (player, opponent)
  }
  
  // 更新游戏状态
  if (isPlayer1) {
    gameState.copy(player1 = updatedPlayer, player2 = updatedOpponent)
  } else {
    gameState.copy(player1 = updatedOpponent, player2 = updatedPlayer)
  }
}

/**
 * 计算反弹伤害
 */
private def calculateDamageToReflect(opponentAction: Option[BattleAction]): Int = {
  opponentAction.flatMap { action =>
    action.Action match {
      case Right(activeAction) =>
        // 对于攻击行动，反弹基础伤害的一部分
        Some((activeAction.getTotalAttack.values.sum) / 2)
      case _ => Some(0) // 非攻击行动不反弹伤害
    }
  }.getOrElse(0) // 没有行动时不反弹伤害
}