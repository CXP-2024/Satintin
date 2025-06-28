package Common.Serialize

import Common.API.PlanContext
import Common.ServiceUtils.schemaName
import cats.effect.IO

trait TWTableTemplateRow extends CirceSerializable {

  /***
   * 列归属的表名称
   * @see [[Process.Init.init]]
   */
  def tableName: String

  /**
   * 表初始化的 SQL 语句
   * @see [[Process.Init.init]]
   */
  def initSQL: String

  /**
   * 表初始化的 IO 命令
   */
  def initIO(using PlanContext): IO[Any]

  /**
   * 表全名
   * @return
   */
  def fullTableName: String = s"${schemaName}.${tableName}"
}
