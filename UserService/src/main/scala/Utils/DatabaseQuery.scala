package Utils

import java.sql.{Connection, DriverManager, ResultSet}
import scala.util.{Try, Using}

// 简单的数据库查询工具
object DatabaseQuery extends App {

  // 数据库连接信息
  val url = "jdbc:postgresql://localhost:5432/tongwen"
  val user = "db"
  val password = "root"

  println("=== 数据库查询工具 ===")
  
  try {
    // 加载 PostgreSQL 驱动
    Class.forName("org.postgresql.Driver")
    
    Using(DriverManager.getConnection(url, user, password)) { connection =>
      queryTableStructure(connection)
      queryUserData(connection)
      testMessageBoxValidation()
    } match {
      case scala.util.Success(_) => println("\n查询完成！")
      case scala.util.Failure(ex) => println(s"\n查询失败: ${ex.getMessage}")
    }
  } catch {
    case ex: Exception => println(s"连接数据库失败: ${ex.getMessage}")
  }

  // 查询表结构
  def queryTableStructure(connection: Connection): Unit = {
    println("\n--- 查询 user_social_table 表结构 ---")
    
    val sql = """
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'user_social_table'
      ORDER BY ordinal_position
    """
    
    Using(connection.prepareStatement(sql)) { stmt =>
      Using(stmt.executeQuery()) { rs =>
        while (rs.next()) {
          val name = rs.getString("column_name")
          val dataType = rs.getString("data_type")
          val nullable = rs.getString("is_nullable")
          val default = Option(rs.getString("column_default")).getOrElse("无")
          println(s"列: $name | 类型: $dataType | 可空: $nullable | 默认值: $default")
        }
      }
    }
  }

  // 查询用户数据
  def queryUserData(connection: Connection): Unit = {
    println("\n--- 查询前5条用户数据 ---")
    
    val sql = """
      SELECT user_id, friend_list, black_list, message_box
      FROM user_social_table 
      LIMIT 5
    """
    
    Using(connection.prepareStatement(sql)) { stmt =>
      Using(stmt.executeQuery()) { rs =>
        var index = 0
        while (rs.next()) {
          index += 1
          val userId = rs.getString("user_id")
          val friendList = rs.getString("friend_list")
          val blackList = rs.getString("black_list")
          val messageBox = rs.getString("message_box")
          
          println(s"\n用户 $index: $userId")
          println(s"  好友列表: $friendList")
          println(s"  黑名单: $blackList")
          println(s"  消息盒子: $messageBox")
          validateMessageBox(messageBox)
        }
      }
    }
  }

  // 验证消息盒子格式
  def validateMessageBox(messageBox: String): Unit = {
    try {
      // 简单验证 JSON 格式
      if (messageBox.trim.startsWith("[") && messageBox.trim.endsWith("]")) {
        val content = messageBox.trim.stripPrefix("[").stripSuffix("]")
        if (content.isEmpty) {
          println("    ✓ 消息盒子格式正确，空数组")
        } else {
          // 简单计算消息数量（通过 } 的数量）
          val messageCount = content.count(_ == '}')
          println(s"    ✓ 消息盒子格式正确，大约包含 $messageCount 条消息")
          
          // 显示前100个字符作为预览
          val preview = if (content.length > 100) content.take(100) + "..." else content
          println(s"    预览: $preview")
        }
      } else {
        println(s"    ✗ 消息盒子格式错误，不是JSON数组格式")
      }
    } catch {
      case ex: Exception => println(s"    ✗ 解析失败: ${ex.getMessage}")
    }
  }

  // 测试消息盒子验证功能
  def testMessageBoxValidation(): Unit = {
    println("\n--- 测试消息盒子解析 ---")
    
    val testCases = List(
      "[]" -> "空数组",
      """[{"from":"user1","to":"user2","content":"Hello","timestamp":"2025-01-14T10:00:00Z"}]""" -> "单条消息",
      """[{"from":"user1","to":"user2","content":"Hello","timestamp":"2025-01-14T10:00:00Z"},{"from":"user2","to":"user1","content":"Hi","timestamp":"2025-01-14T10:01:00Z"}]""" -> "多条消息"
    )

    testCases.foreach { case (json, description) =>
      println(s"\n测试案例: $description")
      println(s"JSON: $json")
      validateMessageBox(json)
    }
  }
}

// 查询特定用户的工具
object QuerySpecificUser extends App {
  val url = "jdbc:postgresql://localhost:5432/tongwen"
  val user = "db"
  val password = "root"

  val userId = if (args.length > 0) args(0) else "defaultUser"
  
  println(s"=== 查询用户 $userId 的详细信息 ===")
  
  try {
    Class.forName("org.postgresql.Driver")
    
    Using(DriverManager.getConnection(url, user, password)) { connection =>
      val sql = """
        SELECT user_id, friend_list, black_list, message_box
        FROM user_social_table 
        WHERE user_id = ?
      """
      
      Using(connection.prepareStatement(sql)) { stmt =>
        stmt.setString(1, userId)
        Using(stmt.executeQuery()) { rs =>
          if (rs.next()) {
            val foundUserId = rs.getString("user_id")
            val friendList = rs.getString("friend_list")
            val blackList = rs.getString("black_list")
            val messageBox = rs.getString("message_box")
            
            println(s"用户ID: $foundUserId")
            println(s"好友列表: $friendList")
            println(s"黑名单: $blackList")
            println(s"消息盒子: $messageBox")
            DatabaseQuery.validateMessageBox(messageBox)
          } else {
            println(s"未找到用户: $userId")
          }
        }
      }
    } match {
      case scala.util.Success(_) => println("\n查询完成！")
      case scala.util.Failure(ex) => println(s"\n查询失败: ${ex.getMessage}")
    }
  } catch {
    case ex: Exception => println(s"连接数据库失败: ${ex.getMessage}")
  }
}
