/**
 * BorrowBookMessage
 * desc: 借书操作，用于记录借书行为
 * @param userToken: String (用户登录的Token，用于标识用户身份)
 * @param bookID: String (借阅的图书ID)
 * @return result: String (借书操作的结果信息，例如“借书成功”或错误信息)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class BorrowBookMessage extends TongWenMessage {
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

