package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import org.slf4j.LoggerFactory
import io.circe.Json
import Utils.gamecore.modifyPlayerEnergy

/**
 * 被动行动对被动行动的战斗解决器相关函数
 */

private val logger = LoggerFactory.getLogger(classOf[PassiveAction])

/**
 * 计算被动对象能量变化
 * @param passive 被动行动
 * @param player 玩家状态
 * @return 能量变化值
 */
def calculatePassiveEnergyChange(passive: PassiveAction, player: PlayerState): Int = {
  passive.passiveObject match {
    case cake: CakeObject => 
      logger.info(s"饼类行动，能量增益: ${cake.energyGain}")
      cake.energyGain
    case _: ShieldObject => 
      logger.info(s"盾类行动，消耗所有能量: ${player.energy}")
      -player.energy
    case _ => 
      logger.info("其他被动行动，无能量变化")
      0
  }
}

/**
 * 处理双被动行动的能量变化
 * @param player1 玩家1状态
 * @param player2 玩家2状态
 * @param passive1 玩家1的被动行动
 * @param passive2 玩家2的被动行动
 * @param roundNumber 当前回合数
 * @return (更新后的玩家1状态, 更新后的玩家2状态, 结果JSON)
 */
def resolveEnergyPassiveVSPassive(
  player1: PlayerState,
  player2: PlayerState,
  passive1: PassiveAction,
  passive2: PassiveAction,
  roundNumber: Int
): (PlayerState, PlayerState, Json) = {
  logger.info(s"解决被动vs被动能量变化: ${passive1.passiveObject.getClass.getSimpleName} vs ${passive2.passiveObject.getClass.getSimpleName}")
  
  try {
    // 步骤1: 计算能量变化
    val p1EnergyChange = calculatePassiveEnergyChange(passive1, player1)
    val p2EnergyChange = calculatePassiveEnergyChange(passive2, player2)
    
    logger.info(s"能量变化: P1:${p1EnergyChange}, P2:${p2EnergyChange}")
    
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
      logger.error("被动vs被动能量变化解析过程中出现错误", e)
      (player1, player2, Json.obj("error" -> Json.fromString("战斗解析失败")))
  }
}

/**
 * 处理双被动行动的伤害计算
 * @param player1 玩家1状态
 * @param player2 玩家2状态
 * @param passive1 玩家1的被动行动
 * @param passive2 玩家2的被动行动
 * @param roundNumber 当前回合数
 * @return (更新后的玩家1状态, 更新后的玩家2状态, 结果JSON)
 */
def resolveDamagePassiveVSPassive(
  player1: PlayerState,
  player2: PlayerState,
  passive1: PassiveAction,
  passive2: PassiveAction,
  roundNumber: Int
): (PlayerState, PlayerState, Json) = {
  logger.info(s"解决被动vs被动伤害计算: ${passive1.passiveObject.getClass.getSimpleName} vs ${passive2.passiveObject.getClass.getSimpleName}")
  
  try {
    // 被动对被动通常不会造成伤害，所以直接返回原始状态和空的伤害结果
    val resultsJson = Json.obj(
      "player1" -> Json.obj(
        "healthChange" -> Json.fromInt(0),
        "damageDealt" -> Json.fromInt(0)
      ),
      "player2" -> Json.obj(
        "healthChange" -> Json.fromInt(0),
        "damageDealt" -> Json.fromInt(0)
      )
    )
    
    (player1, player2, resultsJson)
  } catch {
    case e: Exception =>
      logger.error("被动vs被动伤害计算过程中出现错误", e)
      (player1, player2, Json.obj("error" -> Json.fromString("战斗解析失败")))
  }
}