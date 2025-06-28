/**
 * UpdateBookInfoMessage
 * desc: 更新图书记录，用于修改图书信息
 * @param adminToken: String (管理员的身份Token，用于验证管理员权限)
 * @param bookID: String (图书的唯一标识符)
 * @param title: String (图书名称，支持Option类型更新)
 * @param author: String (图书作者，支持Option类型更新)
 * @param category: BookCategory:1041 (图书类别，支持Option类型更新)
 * @param totalCopies: Int (图书库存总量，支持Option类型更新)
 * @return result: String (操作结果字符串，表示更新的状态结果)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { BookCategory } from 'Plugins/BookService/Objects/BookCategory';


export class UpdateBookInfoMessage extends TongWenMessage {
    constructor(
        public  adminToken: string,
        public  bookID: string,
        public  title: string | null,
        public  author: string | null,
        public  category: BookCategory | null,
        public  totalCopies: number | null
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10013"
    }
}

