/**
 * GetUserIDByTokenMessage
 * desc: 根据Token获取UserID
 * @param userToken: String (用户登录Token，用于标识用户身份)
 * @return userID: String (对应的用户ID，用于标识唯一用户)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class GetUserIDByTokenMessage extends TongWenMessage {
    constructor(
        public  userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10012"
    }
}

