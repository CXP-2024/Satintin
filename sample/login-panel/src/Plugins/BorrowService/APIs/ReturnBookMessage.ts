/**
 * ReturnBookMessage
 * desc: 还书操作，用于标记还书行为
 * @param userToken: String (用户的登录Token，用于验证用户身份)
 * @param bookID: String (需要归还的图书ID)
 * @return result: String (操作结果，标识是否还书成功)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class ReturnBookMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  bookID: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

