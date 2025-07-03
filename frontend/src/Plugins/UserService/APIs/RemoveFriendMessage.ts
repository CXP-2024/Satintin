/**
 * RemoveFriendMessage
 * desc: 从好友列表中移除指定好友ID。
 * @param userToken: String (用户标识Token，用于验证用户身份)
 * @param friendID: String (好友的唯一标识ID)
 * @return result: String (操作结果信息，例如“好友已移除！”)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class RemoveFriendMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  friendID: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
}

