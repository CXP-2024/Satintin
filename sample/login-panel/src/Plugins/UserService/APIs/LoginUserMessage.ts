/**
 * LoginUserMessage
 * desc: 用户登录，通过身份证或手机号登录并生成Token
 * @param userName: String (用户的身份证号或手机号，用于唯一标识用户。)
 * @param password: String (用户密码的明文，用于登录验证。)
 * @return loginToken: String (用户登录后的Token，用于后续身份验证。)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class LoginUserMessage extends TongWenMessage {
    constructor(
        public  userName: string,
        public  password: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10012"
    }
}

