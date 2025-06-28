/**
 * CheckUserQuotaMessage
 * desc: 检查用户配额是否满足借书条件，用于借书流程
 * @param userToken: String (用户的身份验证令牌，用于获取userID)
 * @param category: BookCategory:1041 (图书的类别信息)
 * @return result: String (操作结果字符串，可能为‘允许借书’或‘配额不足’)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { BookCategory } from 'Plugins/BookService/Objects/BookCategory';


export class CheckUserQuotaMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  category: BookCategory
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10011"
    }
}

