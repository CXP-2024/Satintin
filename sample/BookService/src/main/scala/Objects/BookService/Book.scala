package Objects.BookService


import io.circe.{Decoder, Encoder, Json}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.*
import io.circe.parser.*
import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

import com.fasterxml.jackson.core.`type`.TypeReference
import Common.Serialize.JacksonSerializeUtils

import scala.util.Try

import org.joda.time.DateTime
import java.util.UUID
import Objects.BookService.BookCategory

/**
 * Book
 * desc: 图书信息，包含具体的书籍属性
 * @param bookID: String (书籍的唯一标识符)
 * @param title: String (书籍的标题)
 * @param author: String (书籍的作者)
 * @param category: BookCategory:1041 (书籍的分类)
 * @param totalCopies: Int (书籍的总拷贝数)
 * @param availableCopies: Int (当前可借出的拷贝数)
 * @param createdAt: DateTime (书籍记录的创建时间)
 * @param updatedAt: DateTime (书籍记录的更新时间)
 */

case class Book(
  bookID: String,
  title: String,
  author: String,
  category: BookCategory,
  totalCopies: Int,
  availableCopies: Int,
  createdAt: DateTime,
  updatedAt: DateTime
){

  //process class code 预留标志位，不要删除


}


case object Book{

    
  import Common.Serialize.CustomColumnTypes.{decodeDateTime,encodeDateTime}

  // Circe 默认的 Encoder 和 Decoder
  private val circeEncoder: Encoder[Book] = deriveEncoder
  private val circeDecoder: Decoder[Book] = deriveDecoder

  // Jackson 对应的 Encoder 和 Decoder
  private val jacksonEncoder: Encoder[Book] = Encoder.instance { currentObj =>
    Json.fromString(JacksonSerializeUtils.serialize(currentObj))
  }

  private val jacksonDecoder: Decoder[Book] = Decoder.instance { cursor =>
    try { Right(JacksonSerializeUtils.deserialize(cursor.value.noSpaces, new TypeReference[Book]() {})) } 
    catch { case e: Throwable => Left(io.circe.DecodingFailure(e.getMessage, cursor.history)) }
  }
  
  // Circe + Jackson 兜底的 Encoder
  given bookEncoder: Encoder[Book] = Encoder.instance { config =>
    Try(circeEncoder(config)).getOrElse(jacksonEncoder(config))
  }

  // Circe + Jackson 兜底的 Decoder
  given bookDecoder: Decoder[Book] = Decoder.instance { cursor =>
    circeDecoder.tryDecode(cursor).orElse(jacksonDecoder.tryDecode(cursor))
  }



  //process object code 预留标志位，不要删除


}

