/**
 * SetUserMatchStatusMessage
 * desc: 设置用户匹配状态。
 * @param userToken: String (用户的登录令牌，用于标识当前用户。)
 * @param matchStatus: String (匹配状态，例如'quick'或'ranked')
 * @return result: String (操作结果的返回信息)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class SetUserMatchStatusMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  matchStatus: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
}