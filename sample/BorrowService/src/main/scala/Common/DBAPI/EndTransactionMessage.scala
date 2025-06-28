package Common.DBAPI

import Common.API.API
import Global.ServiceCenter.tongWenDBServiceCode

case class EndTransactionMessage(commit: Boolean) extends API[String](tongWenDBServiceCode)