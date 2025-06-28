import io.circe.{Decoder, Encoder}
import org.joda.time.DateTime

package object Common {

  // LocalDateTime 与 时间戳(Long) 转换的 encoder/decoder
  given localDateTimeEncoder: Encoder[DateTime] =
    Encoder.encodeLong.contramap[DateTime] { dateTime =>
      dateTime.getMillis
    }

  given localDateTimeDecoder: Decoder[DateTime] =
    Decoder.decodeLong.emap { millis =>
      try {
        Right(new DateTime(millis))
      } catch {
        case e: Exception => Left("LocalDateTime parsing error: " + e.getMessage)
      }
    }

}
