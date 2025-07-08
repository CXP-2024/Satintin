package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import io.circe.Json
import io.circe.syntax._
import org.slf4j.LoggerFactory
import scala.util.Random

/**
 * 卡牌效果管理器 - 负责处理战斗中卡牌效果的应用
 */
object CardEffectManager {
  private val logger = LoggerFactory.getLogger(getClass)
  private val random = new Random()

  /**
   * 卡牌效果结果
   * @param updatedPlayer 应用效果后的玩家状态
   * @param triggeredEffects 触发的卡牌效果列表
   */
  case class CardEffectResult(
    updatedPlayer1: PlayerState,
    updatedPlayer2: PlayerState,
    triggeredEffects: List[CardEffect]
  )
  
  /**
   * 应用卡牌效果
   * @param player1 玩家1状态
   * @param player2 玩家2状态
   * @param action1 玩家1行动
   * @param action2 玩家2行动
   * @return 应用卡牌效果后的结果
   */
  def applyCardEffects(
    player1: PlayerState,
    player2: PlayerState,
    action1: BattleAction,
    action2: BattleAction
  ): CardEffectResult = {
    logger.info(s"开始应用卡牌效果")
    
    // 收集可能触发的卡牌效果
    var triggeredEffects = List.empty[CardEffect]
    var updatedPlayer1 = player1
    var updatedPlayer2 = player2
    
    // 处理玩家1的卡牌效果
    val player1Effects = processPlayerCardEffects(player1, player2, action1, action2)
    triggeredEffects ++= player1Effects.triggeredEffects
    updatedPlayer1 = player1Effects.updatedPlayer1
    updatedPlayer2 = player1Effects.updatedPlayer2
    
    // 处理玩家2的卡牌效果
    val player2Effects = processPlayerCardEffects(updatedPlayer2, updatedPlayer1, action2, action1)
    triggeredEffects ++= player2Effects.triggeredEffects
    updatedPlayer1 = player2Effects.updatedPlayer2 // 注意参数位置交换导致返回值也交换
    updatedPlayer2 = player2Effects.updatedPlayer1
    
    CardEffectResult(
      updatedPlayer1 = updatedPlayer1,
      updatedPlayer2 = updatedPlayer2,
      triggeredEffects = triggeredEffects
    )
  }
  
  /**
   * 处理单个玩家的卡牌效果
   */
  private def processPlayerCardEffects(
    player: PlayerState,
    opponent: PlayerState,
    playerAction: BattleAction,
    opponentAction: BattleAction
  ): CardEffectResult = {
    var updatedPlayer = player
    var updatedOpponent = opponent
    var triggeredEffects = List.empty[CardEffect]
    
    // 遍历玩家所有卡牌
    for (card <- player.cards) {
      // 检查是否触发效果（基于概率）
      val isTriggered = random.nextDouble() < card.effectChance
      
      if (isTriggered) {
        logger.info(s"玩家 ${player.username} 的卡牌 ${card.name} 触发效果: ${card.`type`}")
        
        // 记录触发的效果
        val effect = CardEffect(
          playerId = player.playerId,
          cardName = card.name,
          effectType = card.`type`,
          triggered = true
        )
        triggeredEffects = triggeredEffects :+ effect
        
        // 根据卡牌类型应用效果
        val effectResult = applyCardEffect(card, updatedPlayer, updatedOpponent, playerAction, opponentAction)
        updatedPlayer = effectResult._1
        updatedOpponent = effectResult._2
      }
    }
    
    CardEffectResult(
      updatedPlayer1 = updatedPlayer,
      updatedPlayer2 = updatedOpponent,
      triggeredEffects = triggeredEffects
    )
  }
  
  /**
   * 应用特定卡牌效果
   * @return (更新后的玩家, 更新后的对手)
   */
  private def applyCardEffect(
    card: CardState,
    player: PlayerState,
    opponent: PlayerState,
    playerAction: BattleAction,
    opponentAction: BattleAction
  ): (PlayerState, PlayerState) = {
    card.`type` match {
      case "穿透" => // 穿透效果：额外造成1点伤害
        logger.info(s"应用穿透效果：${card.name}")
        val updatedOpponent = opponent.takeDamage(1)
        (player, updatedOpponent)
        
      case "发育" => // 发育效果：获得1点能量
        logger.info(s"应用发育效果：${card.name}")
        val updatedPlayer = player.copy(energy = math.min(player.energy + 1, BattleConstants.MAX_ENERGY))
        (updatedPlayer, opponent)
        
      case "反弹" => // 反弹效果：对手受到其造成伤害的一部分反弹
        logger.info(s"应用反弹效果：${card.name}")
        val damageToReflect = calculateDamageToReflect(playerAction, opponentAction)
        val updatedOpponent = opponent.takeDamage(damageToReflect)
        (player, updatedOpponent)
        
      case _ =>
        logger.warn(s"未知卡牌效果类型：${card.`type`}")
        (player, opponent)
    }
  }
  
  /**
   * 计算反弹伤害
   */
  private def calculateDamageToReflect(playerAction: BattleAction, opponentAction: BattleAction): Int = {
    opponentAction.Action match {
      case Right(activeAction)  =>
        // 对于攻击行动，反弹基础伤害的一部分
        (activeAction.getTotalAttack.values.sum)/2
      case _ => 0 // 非攻击行动不反弹伤害
    }
  }
}