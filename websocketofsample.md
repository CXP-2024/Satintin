我在sample里面更新了最新的websocket/SSE的样例代码。
websocket： 前后端双向通信。
SSE: 后端向前端单向推送。
前端页面详见：WebSocketDemo （打开前端点击"前往websocket测试"可以进入）
后端详见BookService的代码。

SSE部分：
1. Init里面有一个_ <- Tickers.runTicker.start。这个东西会每4秒发送一个“lalala”
2. routes里面我加了一个
  def updateProject(projectID: String, update: String): IO[Unit] = {
    println(s"updateProject--------------- ${projectID}")
    projects.get(projectID) match {
      case Some(topic) =>
        println("publish it!")
        topic.publish1("data: " + update + "\n\n") >> IO.unit
      case None => IO.unit // No subscribers yet, do nothing.
    }
  }
它会把lalala发送给前端。
3. 我在routes的路由里加了：
    case GET -> Root / "stream" / projectName =>
      println("got request!")
      (projects.get(projectName) match {
        case Some(topic) =>
          val stream = topic.subscribe(10)
          Ok(stream)
        case None =>
          Topic[IO, String].flatMap { topic =>
            projects.putIfAbsent(projectName, topic) match {
              case None =>
                val stream = topic.subscribe(10)
                Ok(stream)
              case Some(existingTopic) =>
                val stream = existingTopic.subscribe(10)
                Ok(stream)
            }
          }
      }).map(_.withHeaders(`Content-Type`(MediaType.unsafeParse("text/event-stream"))))
这个就是用来接收前端SSE的请求、建立连接的。
前端代码：
    useEffect(() => {
        initSSEConnection(`http://127.0.0.1:10013/stream/book`, processSyncMessage)
    }, []);
这是用来连接SSE的。

打开前端的demo页面之后，可以看到：
connecting... http://127.0.0.1:10013/stream/book
SSE连接已成功建立
然后是：
SSE 收到消息: lalala
收到SSE同步包： lalala

这就算对了。


Websocket部分：
1. 在server的run里面，我改了原来的.withHttpApp(app)变成了：
            .withHttpWebSocketApp((wsBuilder: WebSocketBuilder[IO]) => CORS.policy.withAllowOriginAll(serviceWithWebSocket(wsBuilder).orNotFound).unsafeRunSync())
然后加了一个：
  def serviceWithWebSocket(wsBuilder: WebSocketBuilder[IO]): HttpRoutes[IO] = {
    import org.http4s.websocket.WebSocketFrame
    import fs2.Stream
    import cats.effect.std.Queue

    val websocketRoute = HttpRoutes.of[IO] {
      case GET -> Root / "ws" =>
        for {
          queue <- Queue.unbounded[IO, WebSocketFrame]
          response <- wsBuilder.build(
            receive = _.evalMap {
              case WebSocketFrame.Text(msg, _) =>
                IO.println(s"收到客户端消息: $msg") >> queue.offer(WebSocketFrame.Text(s"echo: $msg"))
              case _ => IO.unit
            },
            send = Stream.fromQueueUnterminated(queue)
          )
        } yield response
    }

    // 合并原有的 Routes.service 和 WebSocket 路由
    service <+> websocketRoute
  }
这是专门处理websocket路由的。它做的事情是接收到前端的请求之后直接返回结果。也可以做得更加fancy，类似SSE那样做topic订阅，这里我就没有展开了。

前端代码详见demo的页面。    
useEffect(() => {
        const ws = new WebSocket('ws://localhost:10013/ws')
        wsRef.current = ws

        ws.onopen = () => console.log('WebSocket 连接已建立')
        ws.onmessage = e => {
            console.log('收到消息：', e.data)
            setMessages(prev => [...prev, e.data])
        }
        ws.onerror = e => console.error('WebSocket 错误', e)
        ws.onclose = () => console.log('WebSocket 连接已关闭')

        return () => ws.close()
    }, [])
这段是连接websocket的。每次按一个按钮，前端都会显示：
收到消息： echo: Hello from Frontend!
这就对了。


