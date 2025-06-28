package Utils

//process plan import 预留标志位，不要删除
import io.circe._
import io.circe.syntax._
import io.circe.generic.auto._
import org.joda.time.DateTime
import Common.DBAPI._
import Common.ServiceUtils.schemaName
import org.slf4j.LoggerFactory
import Common.API.PlanContext
import Common.DBAPI.{decodeField, readDBJsonOptional}
import Common.Object.SqlParameter
import Objects.BookService.BookCategory
import cats.effect.IO
import cats.implicits.*
import Common.API.{PlanContext, Planner}
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}
import Objects.QuotaService.BorrowQuota
import io.circe.Json
import Common.Serialize.CustomColumnTypes.{decodeDateTime, encodeDateTime}
import Objects.UserService.UserRole
import Objects.UserService.User

case object QuotaManagementProcess {
  private val logger = LoggerFactory.getLogger(getClass)
  //process plan code 预留标志位，不要删除
  
  def checkQuota(userID: String, category: BookCategory)(using PlanContext): IO[String] = {
  // val logger = LoggerFactory.getLogger(getClass)  // 同文后端处理: logger 统一
  
    // SQL 查询语句
    val sql =
      s"""
         SELECT current_quota, max_quota
         FROM ${schemaName}.borrow_quota_table
         WHERE user_id = ? AND category = ?
       """
  
    logger.info(s"[checkQuota] 开始检查用户配额: userID=${userID}, category=${category.toString}")
  
    // 数据库查询参数
    val queryParams = List(
      SqlParameter("String", userID),
      SqlParameter("String", category.toString) // 枚举类型需要转为字符串
    )
  
    // 查询并解析配额信息
    for {
      optionalQuotaInfo <- readDBJsonOptional(sql, queryParams)
      result <- optionalQuotaInfo match {
        case Some(json) =>
          val currentQuota = decodeField[Int](json, "current_quota")
          val maxQuota = decodeField[Int](json, "max_quota")
          logger.info(s"[checkQuota] 查询到的配额信息: currentQuota=${currentQuota}, maxQuota=${maxQuota}")
  
          if (currentQuota < maxQuota) {
            IO(logger.info("[checkQuota] 配额充足，允许借书")) *> IO.pure("允许借书")
          } else {
            IO(logger.info("[checkQuota] 配额不足，不允许借书")) *> IO.pure("配额不足")
          }
  
        case None =>
          // 如果没有找到记录，默认返回配额不足
          logger.warn(s"[checkQuota] 未找到对应的配额记录: userID=${userID}, category=${category.toString}")
          IO.pure("配额不足")
      }
    } yield result
  }
  
  def queryQuotaDetails(userID: String)(using PlanContext): IO[List[BorrowQuota]] = {
  // val logger = LoggerFactory.getLogger("QuotaDetailsLogger")  // 同文后端处理: logger 统一
  
    for {
      // Step 1: Validate input parameter
      _ <- if (userID.trim.isEmpty) 
              IO.raiseError(new IllegalArgumentException("UserID cannot be empty")) 
           else IO.unit
      _ <- IO(logger.info(s"Validated input userID: ${userID}"))
  
      // Step 2: Retrieve user borrow quota details from the database
      sqlQuery <- IO { s"SELECT * FROM ${schemaName}.borrow_quota_table WHERE user_id = ?" }
      parameters <- IO { List(SqlParameter("String", userID)) }
      dbRows <- readDBRows(sqlQuery, parameters)
  
      _ <- IO(logger.info(s"Retrieved ${dbRows.size} quota records for userID: ${userID}"))
  
      // Step 3: Map the database rows to BorrowQuota objects
      quotaDetails <- IO {
        dbRows.map { row =>
          val categoryStr: String = decodeField[String](row, "category")
          val category: BookCategory = BookCategory.fromString(categoryStr)
          BorrowQuota(
            userID = decodeField[String](row, "user_id"),
            category = category,
            currentQuota = decodeField[Int](row, "current_quota"),
            maxQuota = decodeField[Int](row, "max_quota")
          )
        }
      }
  
      _ <- IO(logger.info(s"Mapped database rows to BorrowQuota objects for userID: ${userID}, result count: ${quotaDetails.size}"))
  
    } yield quotaDetails
  }
  
  def updateQuota(userID: String, category: BookCategory, delta: Int)(using PlanContext): IO[String] = {
    logger.info(s"开始更新用户${userID}图书类别${category}的借阅配额，调整值为${delta}")
  
    // Step 1: 验证用户ID和图书类别是否有效
    val validateUserSQL = s"SELECT COUNT(*) FROM ${schemaName}.user WHERE user_id = ?"
    val validateCategorySQL = s"SELECT ? IN (${BookCategory.values.map(_.toString).mkString("', '")})"
  
    val validationIO = for {
      userExists <- readDBInt(validateUserSQL, List(SqlParameter("String", userID)))
      _ <- if (userExists == 0) then IO.raiseError(new Exception(s"用户ID${userID}不存在")) else IO.unit
      categoryValid <- readDBBoolean(validateCategorySQL, List(SqlParameter("String", category.toString)))
      _ <- if (!categoryValid) then IO.raiseError(new Exception(s"图书类别${category}无效")) else IO.unit
    } yield ()
  
    // Step 2: 计算并更新用户当前的配额值
    val getQuotaSQL =
      s"""
         SELECT current_quota, max_quota
         FROM ${schemaName}.borrow_quota_table
         WHERE user_id = ? AND category = ?
       """
    val updateQuotaSQL =
      s"""
         UPDATE ${schemaName}.borrow_quota_table
         SET current_quota = ?
         WHERE user_id = ? AND category = ?
       """
  
    val updateQuotaIO = for {
      quotasJson <- readDBJsonOptional(getQuotaSQL, List(SqlParameter("String", userID), SqlParameter("String", category.toString)))
      _ <- if (quotasJson.isEmpty) then IO.raiseError(new Exception(s"用户${userID}在类别${category}下没有配额记录")) else IO.unit
      currentQuota = decodeField[Int](quotasJson.get, "current_quota")
      maxQuota = decodeField[Int](quotasJson.get, "max_quota")
      newQuota = currentQuota + delta
      _ <- if (newQuota < 0) then IO.raiseError(new Exception(s"更新后的配额值${newQuota}不能小于0")) else IO.unit
      _ <- if (newQuota > maxQuota) then IO.raiseError(new Exception(s"更新后的配额值${newQuota}超过最大配额${maxQuota}")) else IO.unit
      _ <- writeDB(updateQuotaSQL, List(
        SqlParameter("Int", newQuota.toString),
        SqlParameter("String", userID),
        SqlParameter("String", category.toString)
      ))
    } yield ()
  
    // Step 3: 返回结果
    for {
      _ <- validationIO
      _ <- updateQuotaIO
      result <- IO.pure("操作成功")
      _ <- IO(logger.info(s"用户${userID}在类别${category}下的配额更新完成，结果为：${result}"))
    } yield result
  }
}
