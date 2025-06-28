/**
 * LoginToken
 * desc: 登录令牌信息
 * @param token: String (访问令牌)
 * @param userID: String (用户的唯一标识)
 * @param issuedAt: DateTime (令牌发行时间)
 * @param expiresAt: DateTime (令牌到期时间)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'




export class LoginToken extends Serializable {
    constructor(
        public  token: string,
        public  userID: string,
        public  issuedAt: number,
        public  expiresAt: number
    ) {
        super()
    }
}


