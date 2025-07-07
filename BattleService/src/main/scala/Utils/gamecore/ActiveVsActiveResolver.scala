package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import org.slf4j.LoggerFactory

/**
 * 主动行动对主动行动的战斗解决器
 */
object ActiveVsActiveResolver {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 解决主动vs主动的战斗
   */
  def resolve(
    player1: PlayerState, 
    player2: PlayerState, 
    active1: ActiveAction, 
    active2: ActiveAction,
    roundNumber: Int
  ): (PlayerState, PlayerState, RoundResult) = {
    
    logger.info(s"解决主动vs主动战斗")
    
    // 消耗能量
    val p1AfterEnergy = player1.copy(energy = player1.energy - active1.getTotalEnergyCost)
    val p2AfterEnergy = player2.copy(energy = player2.energy - active2.getTotalEnergyCost)
    
    logger.info(s"能量消耗: P1:${active1.getTotalEnergyCost}, P2:${active2.getTotalEnergyCost}")
    
    val (p1Damage, p2Damage) = (active1, active2) match {
      // 双方都是单一行动且为同对象
      case (single1: SingleAction, single2: SingleAction) if single1.isSameObjectAs(single2) =>
        logger.info("双方都是同对象单一行动")
        resolveSameObjectSingleActions(single1, single2)
      
      // 其他情况都是混合行动处理
      case _ =>
        logger.info("混合行动处理")
        resolveMixedActions(active1, active2)
    }
    
    logger.info(s"伤害计算结果: P1受到${p1Damage}伤害, P2受到${p2Damage}伤害")
    
    val p1After = p1AfterEnergy.copy(health = p1AfterEnergy.health - p1Damage)
    val p2After = p2AfterEnergy.copy(health = p2AfterEnergy.health - p2Damage)
    
    // 如果有人扣血，双方能量清零
    val (p1Final, p2Final) = if (p1Damage > 0 || p2Damage > 0) {
      logger.info("有人扣血，双方能量清零")
      (p1After.copy(energy = 0), p2After.copy(energy = 0))
    } else {
      (p1After, p2After)
    }
    
    val actionRight1 = Right(active1)
    val actionRight2 = Right(active2)
    
    val battleAction1 = BattleAction(actionRight1, player1.playerId, System.currentTimeMillis())
    val battleAction2 = BattleAction(actionRight2, player2.playerId, System.currentTimeMillis())
    
    val result = RoundResult(
      round = roundNumber,
      player1Action = battleAction1,
      player2Action = battleAction2,
      results = io.circe.Json.obj(
        "player1" -> io.circe.Json.obj(
          "healthChange" -> io.circe.Json.fromInt(-p1Damage),
          "energyChange" -> io.circe.Json.fromInt(p1Final.energy - player1.energy)
        ),
        "player2" -> io.circe.Json.obj(
          "healthChange" -> io.circe.Json.fromInt(-p2Damage),
          "energyChange" -> io.circe.Json.fromInt(p2Final.energy - player2.energy)
        )
      ),
      cardEffects = List()
    )
    
    (p1Final, p2Final, result)
  }
  
  /**
   * 解决同对象单一行动战斗
   */
  private def resolveSameObjectSingleActions(single1: SingleAction, single2: SingleAction): (Int, Int) = {
    val stack1 = single1.getTotalStackCount
    val stack2 = single2.getTotalStackCount
    val diff = stack1 - stack2
    
    logger.info(s"同对象单一行动对比: P1:${stack1}层, P2:${stack2}层, 差值:${diff}")
    
    if (diff > 0) {
      // player1 有优势
      val attackObject = single1.getBaseObjects.headOption.getOrElse {
        logger.warn("无法获取单一行动的攻击对象")
        return (0, 0)
      }
      val baseDamage = BattleConstants.getBaseDamageForClass(attackObject.baseClass)
      (0, baseDamage * diff)
    } else if (diff < 0) {
      // player2 有优势  
      val attackObject = single2.getBaseObjects.headOption.getOrElse {
        logger.warn("无法获取单一行动的攻击对象")
        return (0, 0)
      }
      val baseDamage = BattleConstants.getBaseDamageForClass(attackObject.baseClass)
      (baseDamage * (-diff), 0)
    } else {
      // 平衡
      logger.info("双方层数相同，无伤害")
      (0, 0)
    }
  }
  
  /**
   * 解决混合行动战斗
   */
  private def resolveMixedActions(active1: ActiveAction, active2: ActiveAction): (Int, Int) = {
    val p1TotalAttack = active1.getTotalAttack.values.sum
    val p2TotalAttack = active2.getTotalAttack.values.sum
    val p1Defense = active1.getTotalDefense
    val p2Defense = active2.getTotalDefense
    
    logger.info(s"混合行动对比: P1攻击${p1TotalAttack}/防御${p1Defense}, P2攻击${p2TotalAttack}/防御${p2Defense}")
    
    (math.max(0, p2TotalAttack - p1Defense), math.max(0, p1TotalAttack - p2Defense))
  }
}