/**
 * Book
 * desc: 图书信息，包含具体的书籍属性
 * @param bookID: String (书籍的唯一标识符)
 * @param title: String (书籍的标题)
 * @param author: String (书籍的作者)
 * @param category: BookCategory:1041 (书籍的分类)
 * @param totalCopies: Int (书籍的总拷贝数)
 * @param availableCopies: Int (当前可借出的拷贝数)
 * @param createdAt: DateTime (书籍记录的创建时间)
 * @param updatedAt: DateTime (书籍记录的更新时间)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'

import { BookCategory } from 'Plugins/BookService/Objects/BookCategory';


export class Book extends Serializable {
    constructor(
        public  bookID: string,
        public  title: string,
        public  author: string,
        public  category: BookCategory,
        public  totalCopies: number,
        public  availableCopies: number,
        public  createdAt: number,
        public  updatedAt: number
    ) {
        super()
    }
}


