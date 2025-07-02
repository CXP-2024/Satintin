package Global

object ServiceCenter {
  val projectName: String = "SaTT"
  val dbManagerServiceCode = "A000001"
  val tongWenDBServiceCode = "A000002"
  val tongWenServiceCode = "A000003"

  val UserServiceCode = "A000010"
  val CardServiceCode = "A000011"
  val AssetServiceCode = "A000012"
  val AdminServiceCode = "A000013"
  val BattleServiceCode = "A000014"

  val fullNameMap: Map[String, String] = Map(
    tongWenDBServiceCode -> "DB-Manager（DB-Manager）",
    tongWenServiceCode -> "Tong-Wen（Tong-Wen）",
    UserServiceCode -> "UserService（UserService)",
    CardServiceCode -> "CardService（CardService)",
    AssetServiceCode -> "AssetService（AssetService)",
    AdminServiceCode -> "AdminService（AdminService)",
    BattleServiceCode -> "BattleService（BattleService)"
  )

  def serviceName(serviceCode: String): String = {
    fullNameMap(serviceCode).toLowerCase
  }
}
