/**
 * BorrowRecord
 * desc: 借阅记录信息
 * @param recordID: String (记录的唯一ID)
 * @param userID: String (用户ID)
 * @param bookID: String (图书的唯一ID)
 * @param borrowedAt: DateTime (借阅时间)
 * @param dueAt: DateTime (应还时间)
 * @param returnedAt: DateTime (归还时间，如果未归还则为空)
 * @param renewalCount: Int (续借次数)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'




export class BorrowRecord extends Serializable {
    constructor(
        public  recordID: string,
        public  userID: string,
        public  bookID: string,
        public  borrowedAt: number,
        public  dueAt: number,
        public  returnedAt: number | null,
        public  renewalCount: number
    ) {
        super()
    }
}


