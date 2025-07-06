package Utils

import Objects.BattleService._
import Objects.BattleService.core._
import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax._
import cats.effect.IO
import cats.implicits._  // 添加这个导入
import org.slf4j.LoggerFactory
import Common.API.PlanContext
import Common.DBAPI.{readDBJsonOptional, writeDB, decodeField, decodeType}  // 修正导入
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import Utils.ObjectCreationError._

/**
 * 被动对象管理器
 * 负责从数据库创建和管理被动对象，支持动态创建ObjectDefense和ActionDefense
 */
object PassiveObjectManager {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 智能创建被动对象 - 支持动态创建ObjectDefense和ActionDefense
   */
  def createPassiveObjectSmart(
    objectName: String,
    defenseType: Option[String] = None,
    targetObject: Option[AttackObject] = None,
    targetAction: Option[ActiveAction] = None
  )(using PlanContext): IO[Either[ObjectCreationError, PassiveAction]] = {
    
    logger.info(s"智能创建被动对象: $objectName, defenseType: $defenseType")
    
    // 如果是防御类型，直接创建临时对象
    defenseType match {
      case Some("objectDefense") =>
        IO.pure(createObjectDefenseTemporarily(objectName, targetObject))
      
      case Some("actionDefense") =>
        IO.pure(createActionDefenseTemporarily(objectName, targetAction))
      
      case _ =>
        // 否则从数据库查找
        createPassiveObjectFromDB(objectName)
    }
  }

  /**
   * 从数据库安全地创建被动对象
   */
  def createPassiveObjectFromDB(objectName: String)(using PlanContext): IO[Either[ObjectCreationError, PassiveAction]] = {
    for {
      recordOpt <- fetchPassiveObjectRecord(objectName)
      result <- recordOpt match {
        case Some(record) => 
          IO.pure(createPassiveObjectFromRecord(record))
        case None => 
          IO.pure(Left(ObjectNotFoundError(objectName)))
      }
    } yield result
  }

  /**
   * 创建被动行动 - 使用工厂方法
   */
  def createPassiveAction(passiveObject: PassiveObject): PassiveAction = {
    PassiveAction.create(passiveObject)
  }

  /**
   * 临时创建ObjectDefense
   */
  private def createObjectDefenseTemporarily(
    objectName: String, 
    targetObject: Option[AttackObject]
  ): Either[ObjectCreationError, PassiveAction] = {
    targetObject match {
      case Some(target) => 
        val defenseObject = ObjectDefenseObject(
          objectName = objectName,
          targetObject = target,
          description = s"动态创建的对象防御：${target.objectName}"
        )
        Right(createPassiveAction(defenseObject))
      case None => 
        Left(MissingRequiredFieldError("ObjectDefense", "targetObject"))
    }
  }

  /**
   * 临时创建ActionDefense
   */
  private def createActionDefenseTemporarily(
    objectName: String,
    targetAction: Option[ActiveAction]
  ): Either[ObjectCreationError, PassiveAction] = {
    targetAction match {
      case Some(target) => 
        val defenseObject = ActionDefenseObject(
          objectName = objectName,
          targetAction = target,
          description = s"动态创建的行动防御"
        )
        Right(createPassiveAction(defenseObject))
      case None => 
        Left(MissingRequiredFieldError("ActionDefense", "targetAction"))
    }
  }

  /**
   * 从数据库获取被动对象记录
   */
  private def fetchPassiveObjectRecord(objectName: String)(using PlanContext): IO[Option[PassiveObjectRecord]] = {
    readDBJsonOptional(  // 使用 readDBJsonOptional 而不是 readDB
      s"""
      SELECT object_name, object_type, base_class, energy_gain, damage_multiplier, 
             shield_multiplier, target_attack_types, description
      FROM $schemaName.passive_objects_table
      WHERE object_name = ?
      """,
      List(SqlParameter("String", objectName))
    ).map(_.map(convertJsonToPassiveRecord))
     .handleErrorWith { error =>
       logger.error(s"Database error fetching passive object $objectName: ${error.getMessage}")
       IO.pure(None)
     }
  }

  /**
   * JSON到被动对象记录的转换
   */
  private def convertJsonToPassiveRecord(json: Json): PassiveObjectRecord = {
    PassiveObjectRecord(
      objectName = decodeField[String](json, "object_name"),
      objectType = decodeField[String](json, "object_type"),
      baseClass = decodeField[String](json, "base_class"),
      energyGain = decodeField[Int](json, "energy_gain"),
      damageMultiplier = decodeField[Double](json, "damage_multiplier"),
      shieldMultiplier = decodeField[Double](json, "shield_multiplier"),
      targetAttackTypes = try { 
        Some(decodeField[String](json, "target_attack_types")) 
      } catch { 
        case _: Exception => None 
      },
      description = decodeField[String](json, "description")
    )
  }

  /**
   * 从记录创建被动对象
   */
  private def createPassiveObjectFromRecord(record: PassiveObjectRecord): Either[ObjectCreationError, PassiveAction] = {
    for {
      baseClass <- createBaseClass(record.baseClass)
      passiveObject <- record.objectType.toLowerCase match {
        case "cake" => 
          Right(CakeObject(
            objectName = record.objectName,
            energyGain = record.energyGain,
            damageMultiplier = record.damageMultiplier,
            description = record.description
          ))
        case "shield" => 
          Right(ShieldObject(
            objectName = record.objectName,
            shieldMultiplier = record.shieldMultiplier,
            description = record.description
          ))
        case "attack_type_defense" => 
          for {
            attackTypes <- parseAttackTypes(record.targetAttackTypes.getOrElse(""))
          } yield AttackTypeDefenseObject(
            objectName = record.objectName,
            targetAttackTypes = attackTypes,
            description = record.description
          )
        case other => 
          Left(InvalidObjectTypeError(record.objectName, other))
      }
      passiveAction <- Right(createPassiveAction(passiveObject))
    } yield passiveAction
  }

  /**
   * 解析攻击类型字符串
   */
  private def parseAttackTypes(attackTypesStr: String): Either[ObjectCreationError, Set[AttackType]] = {
    if (attackTypesStr.isEmpty) {
      Left(MissingRequiredFieldError("AttackTypeDefense", "targetAttackTypes"))
    } else {
      try {
        val typeStrings = attackTypesStr.split(",").map(_.trim.toLowerCase)
        val attackTypes = typeStrings.map {
          case "normal" => AttackType.Normal
          case "penetration" => AttackType.Penetration
          case "antiair" => AttackType.AntiAir
          case "nuclear" => AttackType.Nuclear
          case other => return Left(InvalidObjectTypeError(other, "AttackType"))
        }.toSet
        Right(attackTypes)
      } catch {
        case e: Exception => Left(InvalidObjectTypeError(attackTypesStr, "AttackTypes"))
      }
    }
  }

  /**
   * 类型安全的BaseClass构造器
   */
  private def createBaseClass(baseClassStr: String): Either[ObjectCreationError, BaseClass] = {
    baseClassStr.toLowerCase match {
      case "cake" => Right(BaseClass.Cake)
      case "shield" => Right(BaseClass.Shield)
      case "type_defense" => Right(BaseClass.TypeDefense)
      case "object_defense" => Right(BaseClass.ObjectDefense)
      case "action_defense" => Right(BaseClass.ActionDefense)
      case other => Left(InvalidObjectTypeError(other, "BaseClass"))
    }
  }

  /**
   * 数据库记录类型
   */
  case class PassiveObjectRecord(
    objectName: String,
    objectType: String,
    baseClass: String,
    energyGain: Int,
    damageMultiplier: Double,
    shieldMultiplier: Double,
    targetAttackTypes: Option[String],
    description: String
  )

  // 序列化器
  given passiveObjectRecordEncoder: Encoder[PassiveObjectRecord] = deriveEncoder
  given passiveObjectRecordDecoder: Decoder[PassiveObjectRecord] = deriveDecoder
}