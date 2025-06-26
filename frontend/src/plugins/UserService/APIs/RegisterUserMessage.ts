/**
 * RegisterUserMessage
 * desc: 根据传入的用户数据创建新用户记录并返回生成的userID。
 * @param username: String (用户的用户名信息。)
 * @param passwordHash: String (用户密码的哈希值。)
 * @param email: String (用户的电子邮箱地址。)
 * @param phoneNumber: String (用户的手机号码。)
 * @return userID: String (生成的新用户ID。)
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'



export class RegisterUserMessage extends TongWenMessage {
    constructor(
        public username: string,
        public passwordHash: string,
        public email: string,
        public phoneNumber: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

