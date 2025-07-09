/**
 * GetChatHistoryMessage
 * desc: 获取与指定用户的聊天历史记录。
 * @param userToken: String (当前用户的凭证，用于验证用户身份。)
 * @param friendID: String (对话好友的用户ID。)
 * @return messages: MessageEntry[] (聊天历史记录列表，包含消息来源、内容及时间。)
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'
import { ServiceConfig } from '../../../Globals/ServiceConfig'



export class GetChatHistoryMessage extends TongWenMessage {
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
