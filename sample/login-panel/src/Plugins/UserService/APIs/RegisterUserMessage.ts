/**
 * RegisterUserMessage
 * desc: 用户注册，生成唯一的用户ID，用于用户注册
 * @param idCard: String (用户身份证，用于验证唯一性)
 * @param phoneNumber: String (用户手机号，用于注册及验证)
 * @param name: String (用户姓名)
 * @param password: String (用户密码，用于后续登录验证)
 * @return userID: String (注册生成的唯一用户ID)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class RegisterUserMessage extends TongWenMessage {
    constructor(
        public  idCard: string,
        public  phoneNumber: string,
        public  name: string,
        public  password: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10012"
    }
}

