package Common

case object ParamUtils {

  def require(requirement: Boolean, errMsg: String = ""): Unit = {
    if (!requirement)
      throw IllegalArgumentException(errMsg)
  }

  def require(requirement: Boolean, ex: Exception): Unit = {
    if (!requirement)
      throw ex
  }


}
