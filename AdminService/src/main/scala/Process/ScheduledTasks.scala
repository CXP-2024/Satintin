package Process

import Common.API.{PlanContext, TraceID}
import Common.DBAPI.writeDB
import Common.Object.SqlParameter
import Common.ServiceUtils.schemaName
import cats.effect.{IO, Resource}
import cats.syntax.functor._
import fs2.Stream
import org.slf4j.LoggerFactory
import java.util.UUID
import scala.concurrent.duration._

object ScheduledTasks {
  private val logger = LoggerFactory.getLogger(this.getClass.getSimpleName)

  def startBanDayDecreaseTask(): Resource[IO, Unit] = {
    val stream = Stream
      .fixedDelay[IO](1.minute)
      .evalMap(_ => runBanDayDecrease())
      .handleErrorWith { error =>
        Stream.eval(IO(logger.error(s"[ScheduledTasks] Error in ban day decrease stream: ${error.getMessage}", error))) ++
        Stream.fixedDelay[IO](1.minute)
      }
      .repeat

    Resource.make(
      stream.compile.drain.start
    )(fiber => 
      IO(logger.info("[ScheduledTasks] Stopping ban day decrease task")) *> 
      fiber.cancel
    ).void
  }

  private def runBanDayDecrease(): IO[Unit] = {
    given PlanContext = PlanContext(TraceID(UUID.randomUUID().toString), 0)
    
    for {
      _ <- IO(logger.info("[ScheduledTasks] Starting ban day decrease (1 minute interval)"))
      affectedUsers <- decreaseBanDays()
      _ <- IO(logger.info(s"[ScheduledTasks] Ban day decrease completed. Affected users: $affectedUsers"))
    } yield ()
  }

  private def decreaseBanDays()(using PlanContext): IO[Int] = {
    val userServiceSchema = "userservice"
    
    val countSql = 
      s"""
        SELECT COUNT(*) FROM ${userServiceSchema}.user_table 
        WHERE ban_days > 0
      """
    
    val updateSql = 
      s"""
        UPDATE ${userServiceSchema}.user_table 
        SET ban_days = ban_days - 1 
        WHERE ban_days > 0
      """

    for {
      // Get count before update for logging
      countResult <- Common.DBAPI.readDBString(countSql, List())
      affectedCount <- IO(countResult.toIntOption.getOrElse(0))
      
      // Perform the update if there are users to update
      _ <- if (affectedCount > 0) {
        writeDB(updateSql, List()).void
      } else {
        IO(logger.info("[ScheduledTasks] No users with ban_days > 0 found"))
      }
      
      _ <- IO(logger.info(s"[ScheduledTasks] Ban days decreased for $affectedCount users"))
    } yield affectedCount
  }
}