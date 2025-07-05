package Utils

import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import cats.implicits._
import Common.API.PlanContext
import cats.effect.IO
import Common.Object.SqlParameter

case object CardBattleDeckUtils {
  private val logger = LoggerFactory.getLogger(getClass)

  /**
   * 加载用户战斗卡组配置
   * @param userID 用户ID
   * @return 卡组中的卡牌ID列表
   */
  def loadUserBattleDeck(userID: String)(using PlanContext): IO[List[String]] = {
    for {
      _ <- IO(logger.info(s"[loadUserBattleDeck] 开始加载用户战斗卡组，userID='${userID}'"))
      
      // Step 1: Validate input parameter
      _ <- if (userID == null || userID.trim.isEmpty) {
        IO.raiseError(new IllegalArgumentException("用户ID不能为空或无效"))
      } else {
        IO(logger.info("[loadUserBattleDeck] 输入参数验证通过"))
      }

      // Step 2: Query user battle deck from database
      querySQL <- IO {
        s"SELECT card_ids FROM ${schemaName}.user_battle_deck_table WHERE user_id = ?"
      }
      parameters <- IO(List(SqlParameter("String", userID)))
      _ <- IO(logger.info(s"[loadUserBattleDeck] 查询SQL: ${querySQL}，参数: ${parameters}"))

      // Step 3: Execute query and handle result
      result <- readDBJsonOptional(querySQL, parameters).flatMap {
        case Some(json) =>
          val cardIdsJson = decodeField[String](json, "card_ids")
          IO {
            logger.info(s"[loadUserBattleDeck] 查询成功，原始卡组数据: ${cardIdsJson}")
          } >> {
            try {
              // 首先尝试直接解析JSON
              val deckCards = io.circe.parser.decode[List[String]](cardIdsJson) match {
                case Right(cards) => 
                  logger.info(s"[loadUserBattleDeck] JSON解析成功: ${cards}")
                  cards
                case Left(err) => 
                  logger.warn(s"[loadUserBattleDeck] 直接解析JSON失败: ${err.getMessage}")
                  // 尝试修复可能的格式问题
                  val cleanedJson = cardIdsJson
                    .replace("{", "[")
                    .replace("}", "]")
                    .replace("\"\"", "\"")
                  logger.info(s"[loadUserBattleDeck] 尝试修复后的JSON: ${cleanedJson}")
                  
                  io.circe.parser.decode[List[String]](cleanedJson) match {
                    case Right(cards) => 
                      logger.info(s"[loadUserBattleDeck] 修复后解析成功: ${cards}")
                      cards
                    case Left(err2) => 
                      logger.warn(s"[loadUserBattleDeck] 修复后仍解析失败: ${err2.getMessage}，返回空列表")
                      List.empty[String]
                  }
              }
              IO {
                logger.info(s"[loadUserBattleDeck] 解析完成，卡组包含 ${deckCards.size} 张卡牌: ${deckCards}")
              } >> IO.pure(deckCards)
            } catch {
              case e: Exception =>
                logger.warn(s"[loadUserBattleDeck] 解析卡组数据异常: ${e.getMessage}，返回空列表")
                IO.pure(List.empty[String])
            }
          }
        case None =>
          // User doesn't have a battle deck record yet
          IO(logger.info(s"[loadUserBattleDeck] 用户 ${userID} 暂无战斗卡组记录，返回空列表")) >>
          IO.pure(List.empty[String])
      }
    } yield result
  }
}