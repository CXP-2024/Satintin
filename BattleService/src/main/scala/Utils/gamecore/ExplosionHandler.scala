package Utils.gamecore

import Objects.BattleService.core._
import Objects.BattleService.{BattleAction, GameState, PlayerState}
import io.circe.{Json, JsonObject}
import io.circe.syntax._
import org.slf4j.LoggerFactory

/**
 * 爆点处理器 - 负责检测和处理爆点情况
 */
object ExplosionHandler {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * 爆点结果
   * @param hasExploded 是否有玩家爆点
   * @param player1Exploded 玩家1是否爆点
   * @param player2Exploded 玩家2是否爆点
   * @param updatedPlayer1 更新后的玩家1状态
   * @param updatedPlayer2 更新后的玩家2状态
   * @param resultsJson 爆点结果的JSON表示
   */
  case class ExplosionResult(
    hasExploded: Boolean,
    player1Exploded: Boolean,
    player2Exploded: Boolean,
    updatedPlayer1: PlayerState,
    updatedPlayer2: PlayerState,
    resultsJson: Json
  )
  
  /**
   * 检查玩家是否爆点
   */
  def checkExplosions(
    gameState: GameState,
    action1: BattleAction,
    action2: BattleAction
  ): ExplosionResult = {
    val player1 = gameState.player1
    val player2 = gameState.player2
    
    // 检查玩家1是否爆点
    val player1Exploded = isExploded(action1.Action, player1.energy)
    
    // 检查玩家2是否爆点
    val player2Exploded = isExploded(action2.Action, player2.energy)
    
    val hasExploded = player1Exploded || player2Exploded
    
    if (hasExploded) {
      val explodedPlayers = List(
        if (player1Exploded) player1.playerId else "",
        if (player2Exploded) player2.playerId else ""
      ).filter(_.nonEmpty)
      
      logger.info(s"爆点玩家: ${explodedPlayers.mkString(", ")}")
      
      // 更新玩家状态 - 爆点玩家扣3血
      val updatedPlayer1 = if (player1Exploded) player1.takeDamage(3) else player1
      val updatedPlayer2 = if (player2Exploded) player2.takeDamage(3) else player2
      
      // 爆点结果JSON
      val resultsJson = Json.obj(
        "exploded" -> Json.True,
        "explodedPlayers" -> Json.arr(explodedPlayers.map(Json.fromString): _*),
        "player1" -> Json.obj(
          "healthChange" -> Json.fromInt(if (player1Exploded) -3 else 0),
          "energyChange" -> Json.fromInt(0)
        ),
        "player2" -> Json.obj(
          "healthChange" -> Json.fromInt(if (player2Exploded) -3 else 0),
          "energyChange" -> Json.fromInt(0)
        )
      )
      
      ExplosionResult(
        hasExploded = true,
        player1Exploded = player1Exploded,
        player2Exploded = player2Exploded,
        updatedPlayer1 = updatedPlayer1,
        updatedPlayer2 = updatedPlayer2,
        resultsJson = resultsJson
      )
    } else {
      // 没有爆点，返回原始状态
      ExplosionResult(
        hasExploded = false,
        player1Exploded = false,
        player2Exploded = false,
        updatedPlayer1 = player1,
        updatedPlayer2 = player2,
        resultsJson = Json.obj("exploded" -> Json.False)
      )
    }
  }
  
  /**
   * 判断玩家行动是否爆点
   */
  private def isExploded(action: Either[PassiveAction, ActiveAction], playerEnergy: Int): Boolean = {
    action match {
      // 检查主动行动能量是否足够
      case Right(activeAction) =>
        val cost = activeAction.getTotalEnergyCost
        cost > playerEnergy
      
      // 检查在能量为0时使用shield
      case Left(passiveAction) =>
        playerEnergy == 0 && isShieldAction(passiveAction)
    }
  }
  
  /**
   * 判断被动行动是否为Shield
   */
  private def isShieldAction(passiveAction: PassiveAction): Boolean = {
    passiveAction.passiveObject.baseClass == BaseClass.Shield
  }
}
