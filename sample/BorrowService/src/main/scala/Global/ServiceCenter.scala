package Global

object ServiceCenter {
  val projectName: String = "LibrarySystem001"
  val dbManagerServiceCode = "A000001"
  val tongWenDBServiceCode = "A000002"
  val tongWenServiceCode = "A000003"

  val BorrowServiceCode = "A000010"
  val QuotaServiceCode = "A000011"
  val UserServiceCode = "A000012"
  val BookServiceCode = "A000013"

  val fullNameMap: Map[String, String] = Map(
    tongWenDBServiceCode -> "DB-Manager（DB-Manager）",
    tongWenServiceCode -> "Tong-Wen（Tong-Wen）",
    BorrowServiceCode -> "BorrowService（BorrowService)",
    QuotaServiceCode -> "QuotaService（QuotaService)",
    UserServiceCode -> "UserService（UserService)",
    BookServiceCode -> "BookService（BookService)"
  )

  def serviceName(serviceCode: String): String = {
    fullNameMap(serviceCode).toLowerCase
  }
}
