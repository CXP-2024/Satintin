package Utils

/**
 * 对象创建错误类型定义
 */
object ObjectCreationError {
  sealed trait ObjectCreationError extends Exception {
    def message: String
    override def getMessage: String = message
  }

  case class ObjectNotFoundError(objectName: String) extends ObjectCreationError {
    val message = s"Object not found: $objectName"
  }

  case class InvalidObjectTypeError(objectName: String, objectType: String) extends ObjectCreationError {
    val message = s"Invalid object type for $objectName: $objectType"
  }

  case class MissingRequiredFieldError(objectName: String, fieldName: String) extends ObjectCreationError {
    val message = s"Missing required field '$fieldName' for object '$objectName'"
  }

  case class DatabaseError(reason: String) extends ObjectCreationError {
    val message = s"Database error: $reason"
  }

  case class ValidationError(objectName: String, reason: String) extends ObjectCreationError {
    val message = s"Validation error for $objectName: $reason"
  }
}