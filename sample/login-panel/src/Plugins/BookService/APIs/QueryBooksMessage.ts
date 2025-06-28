/**
 * QueryBooksMessage
 * desc: 查询图书记录，用于按条件筛选图书
 * @param userToken: String (用户登录会话的Token，用于验证用户身份)
 * @return books: Book:1080 (图书记录列表，包含匹配筛选条件的图书)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class QueryBooksMessage extends TongWenMessage {
    constructor(
        public  userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10013"
    }
}

