package Process

import Common.API.PlanContext
import Common.DBAPI.writeDB
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.IO
import cats.implicits._
import java.util.UUID

/**
 * 初始化游戏数据到数据库
 * 将AttackObject.scala和PassiveAction.scala中的预定义对象插入到数据库中
 */
object InitGameData {
  
  def initGameData(using PlanContext): IO[Unit] = {
    for {
      _ <- initActiveObjects
      _ <- initPassiveObjects
    } yield ()
  }
  
  private def initActiveObjects(using PlanContext): IO[Unit] = {
    val activeObjects = List(
      // 撒类
      ("Sa", "sa", "normal", 1, 5, 1, "基础撒"),
      
      // Tin类
      ("Tin", "tin", "normal", 3, 1, 1, "基础tin"),
      
      // 穿透类
      ("NanMan", "penetration", "penetration", 3, 5, 3, "基础穿透"),
      ("DaShan", "penetration", "penetration", 4, 5, 4, "强力穿透"),
      
      // 防弹类
      ("WanJian", "antiair", "antiair", 2, 5, 3, "基础防弹"),

      
      // 核爆类
      ("Nuclear", "nuclear", "nuclear", 5, 6, 5, "强力核爆")
    )

    activeObjects.traverse { case (name, baseClass, attackType, damage, defense, energyCost, description) =>
      writeDB(
        s"""
        INSERT INTO $schemaName.active_objects_table 
        (object_id, object_name, base_class, attack_type, damage, defense, energy_cost, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (object_name) DO NOTHING
        """,
        List(
          SqlParameter("String", UUID.randomUUID().toString),
          SqlParameter("String", name),
          SqlParameter("String", baseClass),
          SqlParameter("String", attackType),
          SqlParameter("Int", damage.toString),
          SqlParameter("Int", defense.toString),
          SqlParameter("Int", energyCost.toString),
          SqlParameter("String", description)
        )
      )
    }.void
  }
  
  private def initPassiveObjects(using PlanContext): IO[Unit] = {
    val passiveObjects = List(
      // 饼类
      ("Cake", "cake", "cake", 1, 1.0, 1.0, "", "基础饼"),
      ("Pouch", "cake", "cake", 2, 3.0, 1.0, "", "馕"),
      
      // 盾类
      ("BasicShield", "shield", "shield", 0, 1.0, 1.0, "", "基础盾"),

      // 攻击类型防御
      ("BasicDefense", "attack_type_defense", "type_defense", 0, 1.0, 1.0, "normal,antiair", "基础攻击防御")
    )

    passiveObjects.traverse { case (name, objectType, baseClass, energyGain, damageMultiplier, shieldMultiplier, targetAttackTypes, description) =>
      writeDB(
        s"""
        INSERT INTO $schemaName.passive_objects_table 
        (object_id, object_name, object_type, base_class, energy_gain, damage_multiplier, shield_multiplier, target_attack_types, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (object_name) DO NOTHING
        """,
        List(
          SqlParameter("String", UUID.randomUUID().toString),
          SqlParameter("String", name),
          SqlParameter("String", objectType),
          SqlParameter("String", baseClass),
          SqlParameter("Int", energyGain.toString),
          SqlParameter("Double", damageMultiplier.toString),
          SqlParameter("Double", shieldMultiplier.toString),
          SqlParameter("String", if (targetAttackTypes == null) null else targetAttackTypes),
          SqlParameter("String", description)
        )
      )
    }.void
  }
}