/**
 * RenewBookMessage
 * desc: 用于延长借阅期限的续借操作。
 * @param userToken: String (用户身份认证Token，用于验证用户身份。)
 * @param recordID: String (借书记录的唯一标识符。)
 * @return result: String (续借操作结果的字符串描述，例如“续借成功”或失败信息。)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class RenewBookMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  recordID: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

