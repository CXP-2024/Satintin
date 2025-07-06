package Objects.BattleService

import Objects.BattleService.core._
import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}

// ==================== 玩家状态 ====================

case class PlayerState(
  playerId: String,
  userName: String,
  health: Int = 6,
  energy: Int = 0,
  currentAction: Option[Either[PassiveAction, ActiveAction]] = None,
  cards: List[String] = List.empty
) {
  def isAlive: Boolean = health > 0
  
  def canAfford(energyCost: Int): Boolean = energy >= energyCost
  
  def takeDamage(damage: Int): PlayerState = copy(health = health - damage)
  
  def addEnergy(amount: Int): PlayerState = copy(energy = energy + amount)
  
  def clearEnergy(): PlayerState = copy(energy = 0)
  
  def setAction(action: Either[PassiveAction, ActiveAction]): PlayerState = 
    copy(currentAction = Some(action))
  
  def clearAction(): PlayerState = copy(currentAction = None)
  
  // 检查是否会爆点
  def wouldExplode: Boolean = currentAction match {
    case Some(Right(activeAction)) => energy < activeAction.getTotalEnergyCost
    case _ => false
  }
}

object PlayerState {
  implicit val playerStateEncoder: Encoder[PlayerState] = deriveEncoder
  implicit val playerStateDecoder: Decoder[PlayerState] = deriveDecoder
}