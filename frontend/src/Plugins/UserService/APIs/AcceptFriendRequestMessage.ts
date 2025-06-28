/**
 * AcceptFriendRequestMessage
 * desc: 更改好友请求的状态并添加到好友列表。
 * @param userToken: String (用户的登录令牌，用于标识当前用户。)
 * @param friendID: String (好友的用户ID，用于标识请求的目标用户。)
 * @return result: String (操作结果的返回信息，例如'好友请求已接受！')
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class AcceptFriendRequestMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  friendID: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

