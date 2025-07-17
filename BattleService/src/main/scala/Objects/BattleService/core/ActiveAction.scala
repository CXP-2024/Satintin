package Objects.BattleService.core

import Objects.BattleService.*
import Objects.BattleService.core.{ActionCategory, AttackObject, AttackType}
import io.circe.{Decoder, Encoder, Json, HCursor}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils

import scala.util.Try

// ==================== 主动行动 ====================

sealed trait ActiveAction {
  def attackObjects: Map[AttackObject, Int]  // 攻击对象 -> 叠加次数
  def actionCategory: ActionCategory = ActionCategory.Active
  
  // 计算总攻击力
  lazy val getTotalAttack: Map[AttackType, Int] = 
    attackObjects.foldLeft(Map.empty[AttackType, Int]) { case (acc, (attackObject, stackCount)) =>
      val attackType = attackObject.attackType
      val damage = attackObject.damage * stackCount
      acc + (attackType -> (acc.getOrElse(attackType, 0) + damage))
    }
  
  // 计算总防御力
  lazy val getTotalDefense: Int = 
    attackObjects.map { case (attackObject, stackCount) => 
      attackObject.defense * stackCount 
    }.sum
  
  // 计算总能量消耗
  lazy val getTotalEnergyCost: Int = 
    attackObjects.map { case (attackObject, stackCount) => 
      attackObject.energyCost * stackCount 
    }.sum
  
  // 获取所有基础对象
  lazy val getBaseObjects: Set[AttackObject] = attackObjects.keys.toSet

  // 检查是否为单一类型
  lazy val isSingleObject: Boolean = attackObjects.keys.size == 1

  // 检查是否为混合行动
  lazy val isMixed: Boolean = attackObjects.keys.size > 1

  // 检查是否包含特定类型的攻击对象
  def containsObject(attackObject: AttackObject): Boolean = 
    attackObjects.keys.exists(_ == attackObject)
  
  // 移除特定类型的攻击对象（用于防御处理）
  def removeAttackObjects(attackObject: AttackObject): Option[ActiveAction] = {
    val filtered = attackObjects.filter { case (obj, _) => obj != attackObject }
    if (filtered.nonEmpty) {
      Some(ActiveAction.create(filtered))
    } else {
      None
    }
  }
}

/**
 * 单一行动 - 只包含一种类型的攻击对象
 */
case class SingleAction(
  attackObjects: Map[AttackObject, Int]
) extends ActiveAction {
  
  require(attackObjects.nonEmpty, "单一行动必须包含至少一个攻击对象")
  require(attackObjects.values.forall(_ > 0), "所有叠加次数必须大于0")
  require(isSingleObject == true, "单一行动只能包含一种类型的攻击对象")

  // 检查是否与另一个单一行动为同类
  def isSameObjectAs(other: SingleAction): Boolean = 
    this.getBaseObjects == other.getBaseObjects
  
  // 获取总叠加次数
  lazy val getTotalStackCount: Int = attackObjects.values.sum
  
  // 如果只有一个攻击对象，获取它
  lazy val getSingleAttackObject: Option[(AttackObject, Int)] = attackObjects.headOption
}

/**
 * 复合行动 - 包含多种类型的攻击对象
 */
case class CompositeAction(
  attackObjects: Map[AttackObject, Int]
) extends ActiveAction {
  
  require(attackObjects.nonEmpty, "复合行动必须包含至少一个攻击对象")
  require(attackObjects.values.forall(_ > 0), "所有叠加次数必须大于0")
  require(isMixed == true, "复合行动必须包含至少两种类型的攻击对象")

  // 复合行动必然是混合行动
  override lazy val isMixed: Boolean = true
  
  // 获取等效的单一行动列表
  lazy val getSingleActions: List[SingleAction] = 
    attackObjects.toList.map { case (attackObject, stackCount) =>
      SingleAction(Map(attackObject -> stackCount))
    }
}

object ActiveAction {
  // 为 SingleAction 和 CompositeAction 创建编码器
  private val singleActionEncoder: Encoder[SingleAction] = deriveEncoder
  private val compositeActionEncoder: Encoder[CompositeAction] = deriveEncoder
  
  // 为 SingleAction 和 CompositeAction 创建解码器
  private val singleActionDecoder: Decoder[SingleAction] = deriveDecoder
  private val compositeActionDecoder: Decoder[CompositeAction] = deriveDecoder

  // 为 Map[AttackObject, Int] 创建自定义编码器
  implicit val mapEncoder: Encoder[Map[AttackObject, Int]] = (map: Map[AttackObject, Int]) => {
    Json.obj(
      "entries" -> Json.arr(
        map.toList.map { case (attackObject, count) =>
          Json.obj(
            "attackObject" -> attackObject.asJson,
            "count" -> Json.fromInt(count)
          )
        }*
      )
    )
  }

  // 为 Map[AttackObject, Int] 创建自定义解码器
  implicit val mapDecoder: Decoder[Map[AttackObject, Int]] = (c: HCursor) => {
    for {
      entries <- c.downField("entries").as[List[Json]]
      result <- {
        val mapEntries = entries.map { json =>
          for {
            attackObject <- json.hcursor.downField("attackObject").as[AttackObject]
            count <- json.hcursor.downField("count").as[Int]
          } yield (attackObject, count)
        }
        
        val errors = mapEntries.collect { case Left(error) => error }
        if (errors.nonEmpty) {
          Left(errors.head)
        } else {
          Right(mapEntries.collect { case Right(entry) => entry }.toMap)
        }
      }
    } yield result
  }

  // Circe 默认的 Encoder
  private val circeEncoder: Encoder[ActiveAction] = Encoder.instance {
    case sa: SingleAction => singleActionEncoder(sa).deepMerge(Json.obj("type" -> Json.fromString("single")))
    case ca: CompositeAction => compositeActionEncoder(ca).deepMerge(Json.obj("type" -> Json.fromString("composite")))
  }

  // Circe 自定义 Decoder
  private val circeDecoder: Decoder[ActiveAction] = Decoder.instance { cursor =>
    cursor.downField("type").as[String].flatMap {
      case "single" => singleActionDecoder.tryDecode(cursor)
      case "composite" => compositeActionDecoder.tryDecode(cursor)
      case other => Left(io.circe.DecodingFailure(s"Unknown ActiveAction type: $other", cursor.history))
    }
  }

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[ActiveAction] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[ActiveAction] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[ActiveAction]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given activeActionEncoder: Encoder[ActiveAction] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given activeActionDecoder: Decoder[ActiveAction] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }
  
  // 智能构造函数 - 使用for/yield函数式风格
  def create(attackObjects: Map[AttackObject, Int]): ActiveAction = {
    // 检查输入
    require(attackObjects.nonEmpty, "行动必须包含至少一个攻击对象")
    require(attackObjects.values.forall(_ > 0), "所有叠加次数必须大于0")
    
    // 根据攻击对象数量决定创建单一行动还是复合行动
    val attackObjectCount = attackObjects.keys.size
    
    // 返回相应的行动对象
    if (attackObjectCount == 1) SingleAction(attackObjects)
    else CompositeAction(attackObjects)
  }
  
  // 便捷构造函数 - 单个攻击对象
  def single(attackObject: AttackObject, stackCount: Int): SingleAction = 
    SingleAction(Map(attackObject -> stackCount))
  
  // 从攻击对象列表构造
  def fromList(attackObjects: List[(AttackObject, Int)]): ActiveAction = 
    create(attackObjects.toMap)
  
  // 合并两个行动
  def merge(action1: ActiveAction, action2: ActiveAction): ActiveAction = {
    // 合并两个行动的攻击对象
    val combinedSeq = action1.attackObjects.toSeq ++ action2.attackObjects.toSeq
    
    // 对相同的攻击对象进行叠加
    val mergedMap = combinedSeq.groupBy(_._1).view.mapValues(_.map(_._2).sum).toMap
    
    // 创建新的行动
    create(mergedMap)
  }
}