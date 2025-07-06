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
 * 主动对象管理器
 * 负责从数据库创建和管理主动对象
 */
object ActiveObjectManager {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 从数据库安全地创建主动对象
   */
  def createActiveObjectFromDB(objectName: String)(using PlanContext): IO[Either[ObjectCreationError, AttackObject]] = {
    for {
      recordOpt <- fetchActiveObjectRecord(objectName)
      result <- recordOpt match {
        case Some(record) => 
          IO.pure(createActiveObjectFromRecord(record))
        case None => 
          IO.pure(Left(ObjectNotFoundError(objectName)))
      }
    } yield result
  }

  /**
   * 从数据库批量创建主动对象
   */
  def createActiveObjectsFromDB(objectNames: List[String])(using PlanContext): IO[List[Either[ObjectCreationError, AttackObject]]] = {
    objectNames.traverse(createActiveObjectFromDB)  // 使用 traverse 方法
  }

  /**
   * 创建主动行动
   */
  def createActiveAction(attackObjects: Map[String, Int])(using PlanContext): IO[Either[ObjectCreationError, ActiveAction]] = {
    for {
      objectResults <- attackObjects.keys.toList.traverse(createActiveObjectFromDB)  // 使用 traverse 方法
      result <- {
        val errors = objectResults.collect { case Left(error) => error }
        if (errors.nonEmpty) {
          IO.pure(Left(errors.head))
        } else {
          val objects = objectResults.collect { case Right(obj) => obj }
          val objectMap = objects.map(obj => obj -> attackObjects(obj.objectName)).toMap
          IO.pure(Right(ActiveAction.create(objectMap)))
        }
      }
    } yield result
  }

  /**
   * 从数据库获取主动对象记录
   */
  private def fetchActiveObjectRecord(objectName: String)(using PlanContext): IO[Option[ActiveObjectRecord]] = {
    readDBJsonOptional(  // 使用 readDBJsonOptional 而不是 readDB
      s"""
      SELECT object_name, base_class, attack_type, damage, defense, energy_cost, description
      FROM $schemaName.active_objects_table
      WHERE object_name = ?
      """,
      List(SqlParameter("String", objectName))
    ).map(_.map(convertJsonToActiveRecord))
     .handleErrorWith { error =>
       logger.error(s"Database error fetching active object $objectName: ${error.getMessage}")
       IO.pure(None)
     }
  }

  /**
   * JSON到主动对象记录的转换
   */
  private def convertJsonToActiveRecord(json: Json): ActiveObjectRecord = {
    ActiveObjectRecord(
      objectName = decodeField[String](json, "object_name"),
      baseClass = decodeField[String](json, "base_class"),
      attackType = decodeField[String](json, "attack_type"),
      damage = decodeField[Int](json, "damage"),
      defense = decodeField[Int](json, "defense"),
      energyCost = decodeField[Int](json, "energy_cost"),
      description = decodeField[String](json, "description")
    )
  }

  /**
   * 从记录创建主动对象
   */
  private def createActiveObjectFromRecord(record: ActiveObjectRecord): Either[ObjectCreationError, AttackObject] = {
    for {
      baseClass <- createBaseClass(record.baseClass)
      attackType <- createAttackType(record.attackType)
      attackObject <- Right(AttackObject(
        objectName = record.objectName,
        attackType = attackType,
        damage = record.damage,
        defense = record.defense,
        energyCost = record.energyCost,
        baseClass = baseClass,
        description = record.description
      ))
    } yield attackObject
  }

  /**
   * 类型安全的BaseClass构造器
   */
  private def createBaseClass(baseClassStr: String): Either[ObjectCreationError, BaseClass] = {
    baseClassStr.toLowerCase match {
      case "sa" => Right(BaseClass.Sa)
      case "tin" => Right(BaseClass.Tin)
      case "penetration" => Right(BaseClass.Penetration)
      case "antiair" => Right(BaseClass.AntiAir)
      case "nuclear" => Right(BaseClass.Nuclear)
      case other => Left(InvalidObjectTypeError(other, "BaseClass"))
    }
  }

  /**
   * 类型安全的AttackType构造器
   */
  private def createAttackType(attackTypeStr: String): Either[ObjectCreationError, AttackType] = {
    attackTypeStr.toLowerCase match {
      case "normal" => Right(AttackType.Normal)
      case "penetration" => Right(AttackType.Penetration)
      case "antiair" => Right(AttackType.AntiAir)
      case "nuclear" => Right(AttackType.Nuclear)
      case other => Left(InvalidObjectTypeError(other, "AttackType"))
    }
  }

  /**
   * 数据库记录类型
   */
  case class ActiveObjectRecord(
    objectName: String,
    baseClass: String,
    attackType: String,
    damage: Int,
    defense: Int,
    energyCost: Int,
    description: String
  )

  // 序列化器
  given activeObjectRecordEncoder: Encoder[ActiveObjectRecord] = deriveEncoder
  given activeObjectRecordDecoder: Decoder[ActiveObjectRecord] = deriveDecoder
}