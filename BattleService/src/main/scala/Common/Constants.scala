package Common


object Constants {
  val masterBranch: String = "master"

  val basicScalaTypes: List[String] = List("String","Boolean", "Int", "Long", "Float", "Double")
  val basicTsTypes: List[String] = List("string", "number", "boolean")


  val scalaTimeImportStr: String = "import org.joda.time.DateTime"
  val scalaTimeType: String = "DateTime"
  val parameterTimeType: String = "datetime"
  val scalaTimeTypeSet: Seq[String] = List(scalaTimeType, parameterTimeType)
}
