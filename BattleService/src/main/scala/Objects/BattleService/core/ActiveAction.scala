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
  def getTotalAttack: Map[AttackType, Int] = {
    attackObjects.foldLeft(Map.empty[AttackType, Int]) { case (acc, (attackObject, stackCount)) =>
      val attackType = attackObject.attackType
      val damage = attackObject.damage * stackCount
      acc + (attackType -> (acc.getOrElse(attackType, 0) + damage))
    }
  }
  
  // 计算总防御力
  def getTotalDefense: Int = 
    attackObjects.map { case (attackObject, stackCount) => 
      attackObject.defense * stackCount 
    }.sum
  
  // 计算总能量消耗
  def getTotalEnergyCost: Int = 
    attackObjects.map { case (attackObject, stackCount) => 
      attackObject.energyCost * stackCount 
    }.sum
  
  // 获取所有基础对象
  def getBaseObjects: Set[AttackObject] = attackObjects.keys.toSet

  // 检查是否为单一类型
  def isSingleObject: Boolean = getBaseObjects.size == 1

  // 检查是否为混合行动
  def isMixed: Boolean = getBaseObjects.size > 1

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
  def getTotalStackCount: Int = attackObjects.values.sum
  
  // 如果只有一个攻击对象，获取它
  def getSingleAttackObject: Option[(AttackObject, Int)] = 
    if (attackObjects.size == 1) attackObjects.headOption else None
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
  override def isMixed: Boolean = true
  
  // 获取等效的单一行动列表
  def getSingleActions: List[SingleAction] = {
    attackObjects.toList.map { case (attackObject, stackCount) =>
      SingleAction(Map(attackObject -> stackCount))
    }
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
  
  // 智能构造函数 - 根据攻击对象种类数量自动选择类型
  def create(attackObjects: Map[AttackObject, Int]): ActiveAction = {
    require(attackObjects.nonEmpty, "行动必须包含至少一个攻击对象")
    require(attackObjects.values.forall(_ > 0), "所有叠加次数必须大于0")
    
    val classCount = attackObjects.keys.map(_.baseClass).size
    if (classCount == 1) {
      SingleAction(attackObjects)
    } else {
      CompositeAction(attackObjects)
    }
  }
  
  // 便捷构造函数 - 单个攻击对象
  def single(attackObject: AttackObject, stackCount: Int): SingleAction = 
    SingleAction(Map(attackObject -> stackCount))
  
  // 从攻击对象列表构造
  def fromList(attackObjects: List[(AttackObject, Int)]): ActiveAction = {
    create(attackObjects.toMap)
  }
  
  // 合并两个行动
  def merge(action1: ActiveAction, action2: ActiveAction): ActiveAction = {
    val mergedMap = (action1.attackObjects.toSeq ++ action2.attackObjects.toSeq)
      .groupBy(_._1)
      .view.mapValues(_.map(_._2).sum).toMap
    
    create(mergedMap)
  }
}