package Common.Serialize

import Common.Object.IDClass
import cats.syntax.traverse.*
import io.circe.parser.parse
import io.circe.*
import org.joda.time.DateTime // Import Cats' Either syntax

object CustomColumnTypes {
  given encodeIDClassBase[T <: IDClass]: Encoder[T] = Encoder.instance { idClass =>
    Json.fromInt(idClass.v.toInt) // Store only the `.v` value as an integer
  }

  given decodeIDClassBase[T <: IDClass](using factory: Int => T): Decoder[T] = Decoder.instance { cursor =>
    cursor.as[Int].map(v => factory(v)) // Read the int and create the class
  }

  given genericListDecoder[T<: CirceSerializable](using elementDecoder: Decoder[T]): Decoder[List[T]] = new Decoder[List[T]] {
    final def apply(c: HCursor): Decoder.Result[List[T]] = {
      c.value match {
        case jsonArray if jsonArray.isArray =>
          // Use the base decoder explicitly for decoding the list
          jsonArray.asArray match {
            case Some(array) =>
              array.toList
                .traverse(json => json.as[T](elementDecoder)) // Decode each element explicitly
            case None =>
              Left(DecodingFailure("Expected a JSON array but got something else", c.history))
          }

        case jsonString if jsonString.isString =>
          // Decode from stringified JSON array
          jsonString.as[String].flatMap { str =>
            parse(str) match {
              case Right(parsedJson) =>
                parsedJson.as[List[T]](Decoder.decodeList(elementDecoder)) // Use base decoder for list elements
              case Left(err) =>
                Left(DecodingFailure(s"Failed to parse stringified JSON array: ${err.getMessage}", c.history))
            }
          }

        case _ =>
          // If neither case matches, return a decoding failure
          Left(DecodingFailure("Expected a JSON array or a stringified JSON array", c.history))
      }
    }
  }

  given genericDecoder[T <: CirceSerializable](using baseDecoder: Decoder[T]): Decoder[T] = new Decoder[T] {
    final def apply(c: HCursor): Decoder.Result[T] = {
      println(c.value) // Debugging: print the JSON value being decoded
      c.value match {
        case jsonObject if jsonObject.isObject =>
          baseDecoder(c)

        case jsonString if jsonString.isString =>
          // Decode from stringified JSON
          jsonString.as[String].flatMap { str =>
            parse(str) match {
              case Right(parsedJson) =>
                println(parsedJson) // Debugging: print the parsed JSON
                parsedJson.as[T](baseDecoder) // Pass the base decoder explicitly
              case Left(err) =>
                Left(DecodingFailure(s"Failed to parse stringified JSON: ${err.getMessage}", c.history))
            }
          }

        case _ =>
          // If neither case matches, return a decoding failure
          Left(DecodingFailure("Expected a JSON object or a stringified JSON object", c.history))
      }
    }
  }
  //  given [T <: CirceSerializable](using derive: Decoder[T]): Decoder[T] = genericDecoder[T]

  given encodeDateTime: Encoder[DateTime] = Encoder.instance { dateTime =>
    Json.fromLong(dateTime.getMillis)
  }

  given decodeDateTime: Decoder[DateTime] = Decoder.instance { cursor =>
    cursor.as[Long].map(new DateTime(_))
  }

}
