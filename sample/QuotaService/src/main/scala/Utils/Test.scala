package Utils

import Common.API.PlanContext
import cats.effect.IO

object Test:
  def test(st:String)(using PlanContext):IO[String]=
    IO("hello world!")
