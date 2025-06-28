/**
 * MessageEntry
 * desc: 用户的消息记录
 * @param messageSource: String (消息来源)
 * @param messageContent: String (消息内容)
 * @param messageTime: DateTime (消息发送时间)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'




export class MessageEntry extends Serializable {
    constructor(
        public  messageSource: string,
        public  messageContent: string,
        public  messageTime: number
    ) {
        super()
    }
}


