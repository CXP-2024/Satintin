// package Objects.BattleService

// import Objects.BattleService.core._
// import io.circe.{Decoder, Encoder, Json}
// import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
// import io.circe.syntax._

// // ==================== 回合结果 ====================

// case class RoundResult(
//   roundNumber: Int,
//   player1Action: Option[Either[PassiveAction, ActiveAction]],
//   player2Action: Option[Either[PassiveAction, ActiveAction]],
//   player1DamageTaken: Int,
//   player2DamageTaken: Int,
//   player1EnergyChange: Int,
//   player2EnergyChange: Int,
//   explosionOccurred: Boolean,
//   explodedPlayer: Option[String] = None
// )

// // ==================== 游戏状态 ====================

// case class GameState(
//   roomId: String,
//   player1: PlayerState,
//   player2: PlayerState,
//   currentRound: Int = 1,
//   gameStatus: GameStatus = GameStatus.InProgress,
//   roundHistory: List[RoundResult] = List.empty,
//   lastUpdated: Long = System.currentTimeMillis()
// ) {
//   def getPlayer(playerId: String): Option[PlayerState] = {
//     if (player1.playerId == playerId) Some(player1)
//     else if (player2.playerId == playerId) Some(player2)
//     else None
//   }
  
//   def updatePlayer(playerId: String, newState: PlayerState): GameState = {
//     if (player1.playerId == playerId) copy(player1 = newState)
//     else if (player2.playerId == playerId) copy(player2 = newState)
//     else this
//   }
  
//   def bothPlayersReady: Boolean = 
//     player1.currentAction.isDefined && player2.currentAction.isDefined
  
//   def isGameOver: Boolean = gameStatus != GameStatus.InProgress
// }

// // ==================== 游戏结束结果 ====================

// case class GameOverResult(
//   winner: Option[String],
//   finalPlayer1Health: Int,
//   finalPlayer2Health: Int,
//   totalRounds: Int,
//   gameEndReason: String
// )

// object GameState {
//   // 为 Either[PassiveAction, ActiveAction] 创建编码器
//   implicit val eitherActionEncoder: Encoder[Either[PassiveAction, ActiveAction]] = {
//     Encoder.instance {
//       case Left(passive) => Json.obj("isPassive" -> Json.True, "value" -> passive.asJson)
//       case Right(active) => Json.obj("isPassive" -> Json.False, "value" -> active.asJson)
//     }
//   }

//   // 为 Either[PassiveAction, ActiveAction] 创建解码器
//   implicit val eitherActionDecoder: Decoder[Either[PassiveAction, ActiveAction]] = {
//     Decoder.instance { cursor =>
//       cursor.downField("isPassive").as[Boolean].flatMap { isPassive =>
//         val valueCursor = cursor.downField("value")
//         if (isPassive) {
//           valueCursor.as[PassiveAction].map(Left(_))
//         } else {
//           valueCursor.as[ActiveAction].map(Right(_))
//         }
//       }
//     }
//   }

//   implicit val roundResultEncoder: Encoder[RoundResult] = deriveEncoder
//   implicit val roundResultDecoder: Decoder[RoundResult] = deriveDecoder
  
//   implicit val gameStateEncoder: Encoder[GameState] = deriveEncoder
//   implicit val gameStateDecoder: Decoder[GameState] = deriveDecoder
  
//   implicit val gameOverResultEncoder: Encoder[GameOverResult] = deriveEncoder
//   implicit val gameOverResultDecoder: Decoder[GameOverResult] = deriveDecoder
// }