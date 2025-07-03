/**
 * GetUserStatusMessage
 * desc: 根据userID返回用户的在线状态和对战状态。
 * @param userToken: String (用户的Token，用于验证访问权限。)
 * @param userID: String (目标用户的唯一标识符。)
 * @return onlineStatus: Boolean (目标用户的在线状态。)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class GetUserStatusMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  userID: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
}

