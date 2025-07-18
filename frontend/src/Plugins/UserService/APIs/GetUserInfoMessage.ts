/**
 * GetUserInfoMessage
 * desc: 根据userID返回用户的基本信息、补充信息、状态信息及资产状态。
 * @param userID: String (目标用户的唯一标识ID)
 * @return user: User:1049 (完整的用户信息，包括基本信息、资产状态及好友/黑名单等补充信息)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class GetUserInfoMessage extends TongWenMessage {
    constructor(
        public  userID: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
}

