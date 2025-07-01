package Process

import Process.Routes.updateProject
import cats.effect.IO
import fs2.Stream

import scala.concurrent.duration.*

object Tickers{
  def tickTask(): IO[Unit] =
    updateProject("book","lalala")

  // 定时器 stream，每秒执行一次 tickTask
  def runTicker: IO[Unit] =
    Stream.awakeEvery[IO](4.second)
      .evalMap(_ => tickTask())
      .compile
      .drain
}
