/**
 * QueryBorrowRecordsMessage
 * desc: 查询借书记录，用于用户查看或管理员查看借阅记录
 * @param userToken: String (用户的Token，用于验证用户身份及权限)
 * @return records: BorrowRecord (借书记录列表，每个记录包含借阅相关的详细信息)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class QueryBorrowRecordsMessage extends TongWenMessage {
    constructor(
        public  userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

