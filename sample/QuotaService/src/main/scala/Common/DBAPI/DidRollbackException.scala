package Common.DBAPI

/** 这个Exception表示之前已经处理过RollBack的问题了 */
case class DidRollbackException(text:String) extends Exception(text)
