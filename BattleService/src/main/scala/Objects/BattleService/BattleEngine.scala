// package Objects.BattleService

// import Objects.BattleService.core._
// import Utils.gamecore.BattleResolver
// import org.slf4j.LoggerFactory

// /**
//  * 战斗逻辑引擎 - 简化后的主控制器
//  */
// object BattleEngine {
//   private val logger = LoggerFactory.getLogger(getClass)
  
//   /**
//    * 处理一轮游戏
//    */
//   def processRound(gameState: GameState): (GameState, RoundResult) = {
//     logger.info(s"处理第${gameState.currentRound}轮游戏")
    
//     val player1 = gameState.player1
//     val player2 = gameState.player2
    
//     // 1. 检查爆点
//     val (p1AfterExplosion, p2AfterExplosion, explosionResult) = BattleResolver.checkExplosion(player1, player2, gameState.currentRound)
    
//     if (explosionResult.explosionOccurred) {
//       logger.warn("发生爆点，游戏结束")
//       val newGameState = gameState.copy(
//         player1 = p1AfterExplosion.clearAction(),
//         player2 = p2AfterExplosion.clearAction(),
//         currentRound = gameState.currentRound + 1,
//         gameStatus = BattleResolver.determineGameStatus(p1AfterExplosion, p2AfterExplosion),
//         roundHistory = gameState.roundHistory :+ explosionResult
//       )
//       return (newGameState, explosionResult)
//     }
    
//     // 2. 正常战斗结算
//     val (p1AfterBattle, p2AfterBattle, battleResult) = BattleResolver.resolveBattle(p1AfterExplosion, p2AfterExplosion, gameState.currentRound)
    
//     val newGameState = gameState.copy(
//       player1 = p1AfterBattle.clearAction(),
//       player2 = p2AfterBattle.clearAction(),
//       currentRound = gameState.currentRound + 1,
//       gameStatus = BattleResolver.determineGameStatus(p1AfterBattle, p2AfterBattle),
//       roundHistory = gameState.roundHistory :+ battleResult
//     )
    
//     logger.info(s"第${gameState.currentRound}轮结束，游戏状态: ${newGameState.gameStatus}")
//     (newGameState, battleResult)
//   }
// }