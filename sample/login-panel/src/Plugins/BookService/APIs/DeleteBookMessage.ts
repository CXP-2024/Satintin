/**
 * DeleteBookMessage
 * desc: 删除图书记录，用于删除指定图书
 * @param adminToken: String (管理员的登录令牌，用于验证管理员权限)
 * @param bookID: String (需要删除的图书ID)
 * @return result: String (操作结果，例如'删除成功'或错误信息)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class DeleteBookMessage extends TongWenMessage {
    constructor(
        public  adminToken: string,
        public  bookID: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10013"
    }
}

