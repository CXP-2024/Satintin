/**
 * LoginUserMessage
 * desc: 验证用户名和密码哈希是否正确。如果正确，返回包含用户ID和usertoken的JSON字符串。
 * @param username: String (用户名，用于登录时的身份验证。)
 * @param passwordHash: String (用户密码的哈希值，用于与数据库中的存储值进行比对。)
 * @return loginResult: String (包含用户ID和usertoken的JSON字符串)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'

export class LoginUserMessage extends TongWenMessage {
    constructor(
        public username: string,
        public passwordHash: string
    ) {
        super()
    }
    
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

