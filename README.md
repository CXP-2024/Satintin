# SaTinTin -- 在线双人卡牌行动对战游戏
![SaTinTin](assets/satintin.png)

### 类型安全技术栈
- 后端（Scala） 
- 前端（React + TypeScript）
- 数据库（PostgreSQL）
- 实时通信（WebSocket）

### 基本信息
- PgAdmin4 管理数据库
- 使用 Idea 打开后端五个Service文件夹并启动所有的Server.scala， 进入frontend文件夹，并运行：
```bash
npm install
npm start
```
- 浏览器登录 127.0.0.1:3000/login 进入页面， 如需使用其它地址，更改 [ServiceConfig.ts](frontend\src\Globals\ServiceConfig.ts) 文件中的API地址。

### 游戏规则
- 首先注册并登录账号
![login](assets/login.png)
- 随后进入游戏大厅
![Home](assets/gamehome.png)
- 接着前往祈愿界面进行抽卡，并在管理卡组页面设置好出战的三张卡牌
- 进入开始对战可以创建房间发送房间ID给好友，联机匹配对战