/**
 * GetUserInfoMessage
 * desc: 根据userID返回用户的基本信息、补充信息、状态信息及资产状态。
 * @param userToken: String (用户身份令牌，用于校验访问权限)
 * @param userID: String (目标用户的唯一标识ID)
 * @return user: User:1049 (完整的用户信息，包括基本信息、资产状态及好友/黑名单等补充信息)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class GetUserInfoMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  userID: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

