/**
 * BlockUserMessage
 * desc: 将目标用户ID加入当前用户的黑名单列表。
 * @param userToken: String (用户的身份验证令牌，用于识别当前用户。)
 * @param blackUserID: String (需要加入黑名单的目标用户ID。)
 * @return result: String (操作结果字符串，指示黑名单加入操作是否成功。)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class BlockUserMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  blackUserID: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
}

