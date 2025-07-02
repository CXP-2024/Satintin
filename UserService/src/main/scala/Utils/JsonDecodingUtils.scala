package Utils

import io.circe._
import io.circe.syntax._
import Common.DBAPI._
import org.slf4j.LoggerFactory

case object JsonDecodingUtils {
  private val logger = LoggerFactory.getLogger(getClass)
  
  /**
   * Robust helper function to decode friend/blacklist arrays from JSON
   * Handles both actual JSON arrays and string representations of JSON arrays
   */
  def decodeListField(json: Json, fieldName: String): List[String] = {
    try {
      // First try to decode as a normal JSON array field
      decodeField[List[String]](json, fieldName)
    } catch {
      case _: Exception =>
        try {
          // If that fails, try to get the field as a string and parse it as JSON
          val jsonString = decodeField[String](json, fieldName)
          if (jsonString == null || jsonString.trim.isEmpty || jsonString.trim == "null") {
            List.empty[String]
          } else {
            // Parse the string as JSON
            io.circe.parser.decode[List[String]](jsonString) match {
              case Right(list) => list
              case Left(_) => 
                logger.warn(s"Failed to parse JSON string for field $fieldName: $jsonString, returning empty list")
                List.empty[String]
            }
          }
        } catch {
          case ex: Exception =>
            logger.warn(s"Failed to decode field $fieldName from JSON, returning empty list. Error: ${ex.getMessage}")
            List.empty[String]
        }
    }
  }
  
  /**
   * Robust helper function to decode message box arrays from JSON
   * Handles both actual JSON arrays and string representations of JSON arrays
   */
  def decodeMessageField(json: Json, fieldName: String): List[Map[String, String]] = {
    try {
      // First try to decode as a normal JSON array field
      decodeField[List[Map[String, String]]](json, fieldName)
    } catch {
      case _: Exception =>
        try {
          // If that fails, try to get the field as a string and parse it as JSON
          val jsonString = decodeField[String](json, fieldName)
          if (jsonString == null || jsonString.trim.isEmpty || jsonString.trim == "null") {
            List.empty[Map[String, String]]
          } else {
            // Parse the string as JSON
            io.circe.parser.decode[List[Map[String, String]]](jsonString) match {
              case Right(list) => list
              case Left(_) => 
                logger.warn(s"Failed to parse JSON string for field $fieldName: $jsonString, returning empty list")
                List.empty[Map[String, String]]
            }
          }
        } catch {
          case ex: Exception =>
            logger.warn(s"Failed to decode field $fieldName from JSON, returning empty list. Error: ${ex.getMessage}")
            List.empty[Map[String, String]]
        }
    }
  }
}
