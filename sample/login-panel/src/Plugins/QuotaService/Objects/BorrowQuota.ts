/**
 * BorrowQuota
 * desc: 用户借阅配额信息
 * @param userID: String (用户ID)
 * @param category: BookCategory:1041 (借阅图书的分类)
 * @param currentQuota: Int (当前已经借阅的数量)
 * @param maxQuota: Int (最大可借阅数量)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'

import { BookCategory } from 'Plugins/BookService/Objects/BookCategory';


export class BorrowQuota extends Serializable {
    constructor(
        public  userID: string,
        public  category: BookCategory,
        public  currentQuota: number,
        public  maxQuota: number
    ) {
        super()
    }
}


