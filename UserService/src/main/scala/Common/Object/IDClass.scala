package Common.Object

import io.circe.{Decoder, Encoder}

case class IDClass(v: Long)

object IDClass {

  import Common.Serialize.CustomColumnTypes.{decodeIDClassBase, encodeIDClassBase}

  implicit val encodeIDClass: Encoder[IDClass] = encodeIDClassBase[IDClass]
  implicit val decodeIDClass: Decoder[IDClass] = decodeIDClassBase[IDClass](using IDClass.apply)
}
