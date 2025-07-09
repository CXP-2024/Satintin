/**
 * SendMessageMessage
 * desc: 向指定用户发送消息，将消息存储到双方的message_box中。
 * @param userToken: String (发送者的用户凭证，用于验证用户身份。)
 * @param recipientID: String (接收者的用户ID。)
 * @param messageContent: String (消息内容。)
 * @return result: String (发送结果，例如'消息发送成功！')
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'
import { ServiceConfig } from '../../../Globals/ServiceConfig'



export class SendMessageMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  recipientID: string,
        public  messageContent: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
}

