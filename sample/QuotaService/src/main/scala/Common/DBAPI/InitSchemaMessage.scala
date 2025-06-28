package Common.DBAPI

import Common.API.API
import Global.ServiceCenter.tongWenDBServiceCode
import io.circe.generic.auto.*

case class InitSchemaMessage(schemaName: String) extends API[String](tongWenDBServiceCode)