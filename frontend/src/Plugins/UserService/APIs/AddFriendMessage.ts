/**
 * AddFriendMessage
 * desc: 将好友ID加入当前用户的好友列表。
 * @param userToken: String (用户的认证令牌，用于验证用户身份。)
 * @param friendID: String (需要加入好友列表的好友的用户ID。)
 * @return result: String (操作结果信息，例如：好友添加成功！)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class AddFriendMessage extends TongWenMessage {
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

