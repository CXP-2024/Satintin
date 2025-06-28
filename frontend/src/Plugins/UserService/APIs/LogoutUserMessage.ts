/**
 * LogoutUserMessage
 * desc: 将用户的在线状态由在线改为离线。
 * @param userToken: String (用户的身份令牌，用于身份验证)
 * @return result: String (登出结果提示，固定返回"登出成功!")
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class LogoutUserMessage extends TongWenMessage {
    constructor(
        public  userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

