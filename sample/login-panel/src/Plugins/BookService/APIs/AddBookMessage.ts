/**
 * AddBookMessage
 * desc: 添加图书记录
 * @param adminToken: String (管理员的凭证Token，用于验证权限)
 * @param title: String (图书的书名)
 * @param author: String (图书的作者)
 * @param category: BookCategory:1041 (图书的类别)
 * @param totalCopies: Int (图书的总数量)
 * @return bookID: String (生成的图书唯一标识ID)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { BookCategory } from 'Plugins/BookService/Objects/BookCategory';


export class AddBookMessage extends TongWenMessage {
    constructor(
        public  adminToken: string,
        public  title: string,
        public  author: string,
        public  category: BookCategory,
        public  totalCopies: number
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10013"
    }
}

