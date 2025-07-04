/**
 * ReceiveMessagesMessage
 * desc: 按分类返回用户的消息记录，包括好友消息、大世界消息、系统消息。
 * @param userToken: String (用户凭证，用于验证用户身份。)
 * @return messages: MessageEntry:1022 (用户的消息记录列表，包含消息来源、内容及时间。)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class ReceiveMessagesMessage extends TongWenMessage {
    constructor(
        public  userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
}

