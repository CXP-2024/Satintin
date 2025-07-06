package Utils.gamecore

import Objects.BattleService._
import Objects.BattleService.core._

/**
 * 战斗常量定义
 */
object BattleConstants {
  
  // 爆点伤害
  val EXPLOSION_DAMAGE = 3
  
  // 基础伤害表
  def getBaseDamageForClass(baseClass: BaseClass): Int = {
    baseClass match {
      case BaseClass.Sa => 1
      case BaseClass.Tin => 1
      case BaseClass.Penetration => 2
      case BaseClass.AntiAir => 2
      case BaseClass.Nuclear => 3
      case BaseClass.Cake => 0
      case BaseClass.Shield => 0
      case BaseClass.Defense => 0
      case BaseClass.TypeDefense => 0
      case BaseClass.ObjectDefense => 0
      case BaseClass.ActionDefense => 0
      case _ => 1
    }
  }
  
  // 能量上限
  val MAX_ENERGY = 10
  
  // 初始血量
  val INITIAL_HEALTH = 6
  
  // 回合时间限制（秒）
  val ROUND_TIME_LIMIT = 60
}