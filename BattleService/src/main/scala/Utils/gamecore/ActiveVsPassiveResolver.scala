package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._
import org.slf4j.LoggerFactory
import io.circe.Json
import scala.util.Try
import io.circe.syntax.EncoderOps

/**
 * 主动行动对被动行动的战斗解决器相关函数
 */

private val logger = LoggerFactory.getLogger("ActiveVsPassiveResolver")

/**
 * 处理主动对被动行动的能量变化
 * @param player1 玩家1状态
 * @param player2 玩家2状态
 * @param active 主动行动
 * @param passive 被动行动
 * @param isPlayer1Active 玩家1是否为主动方
 * @param roundNumber 当前回合数
 * @return (更新后的玩家1状态, 更新后的玩家2状态, 结果JSON)
 */
def resolveEnergyActiveVSPassive(
  player1: PlayerState,
  player2: PlayerState,
  active: ActiveAction,
  passive: PassiveAction,
  isPlayer1Active: Boolean,
  roundNumber: Int
): (PlayerState, PlayerState, Json) = {
  logger.info(s"解决主动vs被动能量变化: ${if (isPlayer1Active) "P1主动P2被动" else "P1被动P2主动"}")
  try {
    // 被动方的能量变化
    val passiveEnergyChange = passive.passiveObject match {
      case cake: CakeObject => 
        logger.info(s"饼类被动，能量增益: ${cake.energyGain}")
        cake.energyGain
      case _: ShieldObject => 
        val passivePlayer = if (isPlayer1Active) player2 else player1
        val energyLoss = passivePlayer.energy
        logger.info(s"盾类被动，消耗所有能量: ${energyLoss}")
        -energyLoss
      case _ => 
        logger.info("其他被动类型，无能量变化")
        0
    }
    // 主动方消耗能量
    val activeEnergyChange = -active.getTotalEnergyCost
    logger.info(s"主动方消耗能量: ${active.getTotalEnergyCost}")
    // 根据谁是主动方分配能量变化
    val (p1EnergyChange, p2EnergyChange) = if (isPlayer1Active) {
      (activeEnergyChange, passiveEnergyChange)
    } else {
      (passiveEnergyChange, activeEnergyChange)
    }
    // 使用纯函数式方法更新能量
    val p1Final = modifyPlayerEnergy(p1EnergyChange)(player1)
    val p2Final = modifyPlayerEnergy(p2EnergyChange)(player2)
    // 生成结果JSON
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
      logger.error("主动vs被动能量变化解析过程中出现错误", e)
      (player1, player2, Json.obj("error" -> Json.fromString("战斗解析失败")))
  }
}

/**
 * 处理主动对被动行动的伤害计算
 * @param player1 玩家1状态
 * @param player2 玩家2状态
 * @param active 主动行动
 * @param passive 被动行动
 * @param isPlayer1Active 玩家1是否为主动方
 * @param roundNumber 当前回合数
 * @return (更新后的玩家1状态, 更新后的玩家2状态, 结果JSON)
 */
def resolveDamageActiveVSPassive(
  player1: PlayerState,
  player2: PlayerState,
  active: ActiveAction,
  passive: PassiveAction,
  isPlayer1Active: Boolean,
  roundNumber: Int
): (PlayerState, PlayerState, Json) = {
  logger.info(s"解决主动vs被动伤害计算: ${if (isPlayer1Active) "P1主动P2被动" else "P1被动P2主动"}")
  try {
    // 计算伤害
    val (passiveDamage, activeDamage) = PassiveDamageCalculator.calculateDamage(active, passive)
    logger.info(s"伤害计算: 被动方受到${passiveDamage}伤害, 主动方受到${activeDamage}伤害")
    // 根据谁是主动方分配伤害
    val (p1Damage, p2Damage) = if (isPlayer1Active) {
      (activeDamage, passiveDamage) // P1是主动方，P2是被动方
    } else {
      (passiveDamage, activeDamage) // P1是被动方，P2是主动方
    }
    // 使用纯函数式方法更新生命值
    val p1Final = modifyPlayerHealth(-p1Damage)(player1)
    val p2Final = modifyPlayerHealth(-p2Damage)(player2)
    // 创建战斗行动对象（用于记录信息）
    val player1Action = if (isPlayer1Active) {
      BattleAction(Right(active), player1.playerId, System.currentTimeMillis())
    } else {
      BattleAction(Left(passive), player1.playerId, System.currentTimeMillis())
    }
    val player2Action = if (isPlayer1Active) {
      BattleAction(Left(passive), player2.playerId, System.currentTimeMillis())
    } else {
      BattleAction(Right(active), player2.playerId, System.currentTimeMillis())
    }
    // 生成结果JSON
    val resultsJson = Json.obj(
      "player1" -> Json.obj(
        "healthChange" -> Json.fromInt(-p1Damage),
        "damageReceived" -> Json.fromInt(p1Damage),
        "energyChange" -> Json.fromInt(0)
      ),
      "player2" -> Json.obj(
        "healthChange" -> Json.fromInt(-p2Damage),
        "damageReceived" -> Json.fromInt(p2Damage),
        "energyChange" -> Json.fromInt(0)
      ),
      "actions" -> Json.obj(
        "player1" -> player1Action.asJson,
        "player2" -> player2Action.asJson
      )
    )
    (p1Final, p2Final, resultsJson)
  } catch {
    case e: Exception =>
      logger.error("主动vs被动伤害计算过程中出现错误", e)
      (player1, player2, Json.obj("error" -> Json.fromString("战斗解析失败")))
  }
}
