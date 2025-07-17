package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import org.slf4j.LoggerFactory
import io.circe.Json
import Utils.gamecore.{modifyPlayerEnergy, modifyPlayerHealth}

/**
 * 主动行动对主动行动的战斗解决器相关函数
 */

private val logger = LoggerFactory.getLogger(classOf[ActiveAction])

/**
 * 处理同对象单一行动的伤害计算
 */
def resolveSameObjectSingleActions(single1: SingleAction, single2: SingleAction): (Int, Int) = {
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
 * 处理混合行动的伤害计算
 */
def resolveMixedActions(active1: ActiveAction, active2: ActiveAction): (Int, Int) = {
  val p1TotalAttack = active1.getTotalAttack.values.sum
  val p2TotalAttack = active2.getTotalAttack.values.sum
  val p1Defense = active1.getTotalDefense
  val p2Defense = active2.getTotalDefense
  
  logger.info(s"混合行动对比: P1攻击${p1TotalAttack}/防御${p1Defense}, P2攻击${p2TotalAttack}/防御${p2Defense}")
  
  (math.max(0, p2TotalAttack - p1Defense), math.max(0, p1TotalAttack - p2Defense))
}

/**
 * 处理双主动行动的能量变化
 * @param player1 玩家1状态
 * @param player2 玩家2状态
 * @param active1 玩家1的主动行动
 * @param active2 玩家2的主动行动
 * @param roundNumber 当前回合数
 * @return (更新后的玩家1状态, 更新后的玩家2状态, 结果JSON)
 */
def resolveEnergyActiveVSActive(
  player1: PlayerState,
  player2: PlayerState,
  active1: ActiveAction,
  active2: ActiveAction,
  roundNumber: Int
): (PlayerState, PlayerState, Json) = {
  logger.info(s"解决主动vs主动能量变化")
  
  try {
    // 步骤1: 计算能量消耗
    val p1EnergyChange = -active1.getTotalEnergyCost
    val p2EnergyChange = -active2.getTotalEnergyCost
    
    logger.info(s"能量消耗: P1:${active1.getTotalEnergyCost}, P2:${active2.getTotalEnergyCost}")
    
    // 步骤2: 使用纯函数式方法更新能量
    val p1Final = modifyPlayerEnergy(p1EnergyChange)(player1)
    val p2Final = modifyPlayerEnergy(p2EnergyChange)(player2)
    
    // 步骤3: 生成结果JSON
    val resultsJson = Json.obj(
      "player1" -> Json.obj(
        "healthChange" -> Json.fromInt(0),
        "energyChange" -> Json.fromInt(p1EnergyChange)
      ),
      "player2" -> Json.obj(
        "healthChange" -> Json.fromInt(0),
        "energyChange" -> Json.fromInt(p2EnergyChange)
      )
    )
    
    (p1Final, p2Final, resultsJson)
  } catch {
    case e: Exception =>
      logger.error("主动vs主动能量变化解析过程中出现错误", e)
      (player1, player2, Json.obj("error" -> Json.fromString("战斗解析失败")))
  }
}

/**
 * 处理双主动行动的伤害计算
 * @param player1 玩家1状态
 * @param player2 玩家2状态
 * @param active1 玩家1的主动行动
 * @param active2 玩家2的主动行动
 * @param roundNumber 当前回合数
 * @return (更新后的玩家1状态, 更新后的玩家2状态, 结果JSON)
 */
def resolveDamageActiveVSActive(
  player1: PlayerState,
  player2: PlayerState,
  active1: ActiveAction,
  active2: ActiveAction,
  roundNumber: Int
): (PlayerState, PlayerState, Json) = {
  logger.info(s"解决主动vs主动伤害计算")
  
  try {
    // 计算伤害
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
    
    // 使用纯函数式方法更新健康值
    val p1Final = modifyPlayerHealth(-p1Damage)(player1)
    val p2Final = modifyPlayerHealth(-p2Damage)(player2)
    
    // 生成结果JSON
    val resultsJson = Json.obj(
      "player1" -> Json.obj(
        "healthChange" -> Json.fromInt(-p1Damage),
        "damageReceived" -> Json.fromInt(p1Damage),
        "energyChange" -> Json.fromInt(0) // 能量变化在另一处处理
      ),
      "player2" -> Json.obj(
        "healthChange" -> Json.fromInt(-p2Damage),
        "damageReceived" -> Json.fromInt(p2Damage),
        "energyChange" -> Json.fromInt(0) // 能量变化在另一处处理
      )
    )
    
    (p1Final, p2Final, resultsJson)
  } catch {
    case e: Exception =>
      logger.error("主动vs主动伤害计算过程中出现错误", e)
      (player1, player2, Json.obj("error" -> Json.fromString("战斗解析失败")))
  }
}
