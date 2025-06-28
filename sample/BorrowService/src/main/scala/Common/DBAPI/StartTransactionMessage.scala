package Common.DBAPI

import Common.API.API
import Global.ServiceCenter.tongWenDBServiceCode

// StartTransactionMessage case class
case class StartTransactionMessage() extends API[String](tongWenDBServiceCode)