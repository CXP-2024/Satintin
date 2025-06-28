/**
 * CreateAdminMessage
 * desc: 通过超级管理员 Token 创建新管理员。
 * @param superAdminToken: String 管理员凭证
 * @param username: String 新管理员用户名
 * @param passwordHash: String 新管理员密码哈希
 * @return newAdminID: String 新管理员 ID
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'

export class CreateAdminMessage extends TongWenMessage {
    constructor(
        public superAdminToken: string,
        public username: string,
        public passwordHash: string
    ) {
        super()
    }

    getAddress(): string {
        return '127.0.0.1:10013'
    }
}
