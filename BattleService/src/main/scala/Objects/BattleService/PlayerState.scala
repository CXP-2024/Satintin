// package Objects.BattleService

// import Objects.BattleService.core._
// import io.circe.{Decoder, Encoder, Json}
// import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
// import io.circe.syntax._

// // ==================== 玩家状态 ====================

// case class PlayerState(
//   playerId: String,
//   userName: String,
//   health: Int = 6,
//   energy: Int = 0,
//   currentAction: Option[Either[PassiveAction, ActiveAction]] = None,
//   cards: List[String] = List.empty
// ) {
//   def isAlive: Boolean = health > 0
  
//   def canAfford(energyCost: Int): Boolean = energy >= energyCost
  
//   def takeDamage(damage: Int): PlayerState = copy(health = health - damage)
  
//   def addEnergy(amount: Int): PlayerState = copy(energy = energy + amount)
  
//   def clearEnergy(): PlayerState = copy(energy = 0)
  
//   def setAction(action: Either[PassiveAction, ActiveAction]): PlayerState = 
//     copy(currentAction = Some(action))
  
//   def clearAction(): PlayerState = copy(currentAction = None)
  
//   // 检查是否会爆点
//   def wouldExplode: Boolean = currentAction match {
//     case Some(Right(activeAction)) => energy < activeAction.getTotalEnergyCost
//     case _ => false
//   }
// }

// object PlayerState {
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

//   implicit val playerStateEncoder: Encoder[PlayerState] = deriveEncoder
//   implicit val playerStateDecoder: Decoder[PlayerState] = deriveDecoder
// }