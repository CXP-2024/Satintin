/**
 * LogoutUserMessage
 * desc: 用户登出，销毁Token
 * @param userToken: String (用户的登录Token，用以标识用户并进行登出操作。)
 * @return result: String (操作结果字符串，返回登出操作的结果（例如'登出成功'）。)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class LogoutUserMessage extends TongWenMessage {
    constructor(
        public  userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10012"
    }
}

