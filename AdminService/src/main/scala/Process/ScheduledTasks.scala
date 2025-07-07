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
import APIs.UserService.{GetAllUserIDsMessage, GetUserInfoMessage, ModifyUserStatusMessage}

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
    for {
      _ <- IO(logger.info("[ScheduledTasks] 开始获取所有用户ID"))
      
      // Step 1: 获取所有用户ID
      allUserIDs <- GetAllUserIDsMessage().send
      _ <- IO(logger.info(s"[ScheduledTasks] 获取到 ${allUserIDs.length} 个用户ID"))
      
      // Step 2: 遍历每个用户，检查封禁天数并减少
      processedCount <- allUserIDs.foldLeftM(0) { (count, userID) =>
        processUserBanDays(userID).map(processed => if (processed) count + 1 else count)
      }
      
      _ <- IO(logger.info(s"[ScheduledTasks] 封禁天数减少完成，处理了 $processedCount 个用户"))
    } yield processedCount
  }

  private def processUserBanDays(userID: String)(using PlanContext): IO[Boolean] = {
    for {
      // 获取用户信息
      userInfo <- GetUserInfoMessage(userID).send.handleErrorWith { error =>
        IO(logger.warn(s"[ScheduledTasks] 无法获取用户信息: userID=$userID, error=${error.getMessage}")) >>
        IO.raiseError(error)
      }
      
      // 检查封禁天数
      processed <- if (userInfo.banDays > 0) {
        val newBanDays = userInfo.banDays - 1
        for {
          _ <- IO(logger.info(s"[ScheduledTasks] 用户 $userID 封禁天数从 ${userInfo.banDays} 减少到 $newBanDays"))
          _ <- ModifyUserStatusMessage(userID, newBanDays).send
          _ <- IO(logger.debug(s"[ScheduledTasks] 用户 $userID 封禁天数更新成功"))
        } yield true
      } else {
        IO.pure(false)
      }
    } yield processed
  }.handleErrorWith { error =>
    IO(logger.error(s"[ScheduledTasks] 处理用户封禁天数时发生错误: userID=$userID, error=${error.getMessage}")) >>
    IO.pure(false)
  }
}