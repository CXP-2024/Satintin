/**
 * DeleteUserMessage
 * desc: 删除用户接口
 * @param adminToken: String (管理员的Token，用于验证权限)
 * @param userID: String (需要被删除的用户ID)
 * @return result: String (操作结果，例如“删除成功”或错误信息)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class DeleteUserMessage extends TongWenMessage {
    constructor(
        public  adminToken: string,
        public  userID: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10012"
    }
}

