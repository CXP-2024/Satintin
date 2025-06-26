package Common.DBAPI

import Common.API.API
import Common.Object.SqlParameter
import Global.ServiceCenter.tongWenDBServiceCode
import io.circe.Decoder
import io.circe.generic.semiauto.*

case class ReadDBValueMessage(sqlQuery: String, parameters: List[SqlParameter]) extends API[String](tongWenDBServiceCode)
