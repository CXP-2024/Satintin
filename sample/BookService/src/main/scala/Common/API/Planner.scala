package Common.API

import Common.DBAPI.startTransaction
import cats.effect.IO
import io.circe.Encoder

trait Planner[ReturnType]:
  def plan(using planContext: PlanContext): IO[ReturnType]

  def planWithErrorControl(using planContext:PlanContext, encoder: Encoder[ReturnType]):IO[ReturnType]=
    startTransaction{
      plan
    }.onError{e=>
      errorRecovery>>  //这里会运行定制化的error recovery
      IO.println("error:"+e)
    }

  /** 默认是不做任何error recovery的。但是如果在文件系统中出了问题，应该需要调用writeToLocalGitMessage把local的内容重置一遍才对 */
  def errorRecovery(using planContext:PlanContext):IO[Unit]=IO.unit

  def fullPlan(using encoder: Encoder[ReturnType]): IO[ReturnType] =
    IO.println(this) >> planWithErrorControl(using this.planContext, encoder)

  val planContext: PlanContext = PlanContext(TraceID(""), 0)
