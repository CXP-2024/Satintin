package Utils

import Objects.BattleService.BattleAction
import Objects.BattleService.core._
import io.circe._
import io.circe.generic.auto._
import io.circe.parser._
import io.circe.syntax._
import cats.effect.IO
import cats.implicits._
import org.slf4j.LoggerFactory
import Common.API.PlanContext

/**
 * 前端行动类型：被动行动接口
 */
case class FrontendPassiveAction(
  actionCategory: String,
  objectName: String,
  defenseType: Option[String],
  targetObject: Option[String],  // 用于ObjectDefense
  targetAction: Option[List[String]]  // 用于ActionDefense
)

/**
 * 前端行动类型：主动行动接口
 */
case class FrontendActiveAction(
  actionCategory: String,
  actions: List[String]
)

/**
 * 前端行动类型：战斗行动接口
 */
case class FrontendBattleAction(
  `type`: Either[FrontendPassiveAction, FrontendActiveAction],
  playerId: String,
  timestamp: Long
)

/**
 * 战斗行动管理器
 * 负责将前端的行动格式转换为后端行动对象
 */
object BattleActionManager {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 解析前端传来的JSON格式行动数据
   */
  def parseActionJson(jsonStr: String)(using PlanContext): IO[Either[Throwable, BattleAction]] = {
  (for {
    json <- IO.fromEither(parse(jsonStr).left.map(err => new Exception(s"解析JSON失败: ${err.message}")))
    action <- parseBattleAction(json)
  } yield action).attempt
}

private def parseBattleAction(json: Json)(using PlanContext): IO[BattleAction] = {
  for {
    playerId <- IO.fromEither(json.hcursor.downField("playerId").as[String]
      .left.map(err => new Exception(s"解析playerId失败: ${err.message}")))
    timestamp <- IO.fromEither(json.hcursor.downField("timestamp").as[Long]
      .left.map(err => new Exception(s"解析timestamp失败: ${err.message}")))
    
    typeJson <- IO.fromEither(json.hcursor.downField("type").focus
      .toRight(new Exception("找不到type字段")))
    
    actionCategory <- IO.fromEither(typeJson.hcursor.downField("actionCategory").as[String]
      .left.map(err => new Exception(s"解析actionCategory失败: ${err.message}")))
    
    action <- actionCategory match {
      case "passive" => parsePassiveAction(typeJson).map(Left(_))
      case "active" => parseActiveAction(typeJson).map(Right(_))
      case other => IO.raiseError(new Exception(s"不支持的行动类别: $other"))
    }
  } yield BattleAction(action, playerId, timestamp)
}

  /**
   * 解析被动行动
   */
  private def parsePassiveAction(json: Json)(using PlanContext): IO[PassiveAction] = {
    for {
      // 解析基本字段
      objectName <- IO.fromEither(json.hcursor.downField("objectName").as[String]
        .left.map(err => new Exception(s"解析objectName失败: ${err.message}")))
      
      // 解析防御类型
      defenseType <- IO.fromEither(json.hcursor.downField("defenseType").as[Option[String]]
        .left.map(err => new Exception(s"解析defenseType失败: ${err.message}")))
      
      // 根据防御类型创建被动对象
      result <- defenseType match {
        case Some("object_defense") =>
          for {
            // 解析targetObject字段
            targetObjectName <- IO.fromEither(json.hcursor.downField("targetObject").as[Option[String]]
              .left.map(err => new Exception(s"解析targetObject失败: ${err.message}")))
              
            // 如果有目标对象，创建AttackObject
            targetObjectResult <- targetObjectName match {
              case Some(name) => ActiveObjectManager.createActiveObjectFromDB(name)
              case None => IO.pure(Left(ObjectCreationError.MissingRequiredFieldError("PassiveAction", "targetObject")))
            }
            
            // 使用PassiveObjectManager创建被动对象
            action <- PassiveObjectManager.createPassiveObjectSmart(
              objectName = objectName,
              defenseType = Some("object_defense"),
              targetObject = targetObjectResult.toOption,
              targetAction = None
            ).flatMap {
              case Right(action) => IO.pure(action)
              case Left(error) => IO.raiseError(new Exception(s"创建ObjectDefense失败: $error"))
            }
          } yield action
            
        case Some("action_defense") =>
          for {
            // 解析targetAction字段（对象名称列表）
            targetActionNames <- IO.fromEither(json.hcursor.downField("targetAction").as[Option[List[String]]]
              .left.map(err => new Exception(s"解析targetAction失败: ${err.message}")))
              
            // 创建所有AttackObject
            targetObjects <- targetActionNames match {
              case Some(names) if names.nonEmpty => ActiveObjectManager.createActiveObjectsFromDB(names)
              case _ => IO.pure(List(Left(ObjectCreationError.MissingRequiredFieldError("PassiveAction", "targetAction"))))
            }
            
            // 检查是否有创建错误
            _ <- if (targetObjects.exists(_.isLeft)) {
              val errors = targetObjects.collect { case Left(e) => e }
              IO.raiseError(new Exception(s"创建ActionDefense目标对象失败: ${errors.headOption.getOrElse("Unknown error")}"))
            } else IO.unit
            
            // 收集所有成功的对象并创建ActiveAction
            successObjects = targetObjects.collect { case Right(obj) => obj }
            attackObjectsMap = successObjects.map(obj => obj -> 1).toMap
            targetAction = if (attackObjectsMap.nonEmpty) {
              Some(ActiveAction.create(attackObjectsMap))
            } else None
            
            // 创建ActionDefense
            action <- PassiveObjectManager.createPassiveObjectSmart(
              objectName = objectName,
              defenseType = Some("action_defense"),
              targetObject = None,
              targetAction = targetAction
            ).flatMap {
              case Right(action) => IO.pure(action)
              case Left(error) => IO.raiseError(new Exception(s"创建ActionDefense失败: $error"))
            }
          } yield action
            
        case _ =>
          // 常规被动对象直接从数据库创建
          PassiveObjectManager.createPassiveObjectFromDB(objectName).flatMap {
            case Right(action) => IO.pure(action)
            case Left(error) => IO.raiseError(new Exception(s"创建被动对象失败: $error"))
          }
      }
    } yield result
  }

  /**
   * 解析主动行动
   */
  private def parseActiveAction(json: Json)(using PlanContext): IO[ActiveAction] = {
    for {
      // 解析主动行动的攻击对象名称列表
      actionNames <- IO.fromEither(json.hcursor.downField("actions").as[List[String]].left.map(err => new Exception(s"解析actions失败: ${err.message}")))
      
      // 验证列表非空
      _ <- if (actionNames.isEmpty) IO.raiseError(new Exception("主动行动列表不能为空")) else IO.unit
      
      // 为每个攻击对象创建后端对象
      objectResults <- ActiveObjectManager.createActiveObjectsFromDB(actionNames)
      
      // 检查是否有错误
      errors = objectResults.collect { case Left(error) => error }
      _ <- if (errors.nonEmpty) IO.raiseError(new Exception(s"创建攻击对象时出错: ${errors.head}")) else IO.unit
      
      // 构建攻击对象映射，每个对象出现一次，所以数量为1
      objects = objectResults.collect { case Right(obj) => obj }
      objectMap = objects.map(obj => obj -> 1).toMap
      
      // 创建主动行动
      activeAction <- ActiveObjectManager.createActiveAction(objectMap.map { case (k, v) => k.objectName -> v }).flatMap {
        case Right(action) => IO.pure(action)
        case Left(error) => IO.raiseError(new Exception(s"创建主动行动失败: $error"))
      }
    } yield activeAction
  }
}
