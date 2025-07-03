/** 
 * LoginAdminMessage
 * desc: 管理员登录，验证账号和密码哈希，返回 token
 * @param accountName: string 管理员账号
 * @param passwordHash: string 管理员密码哈希
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export class LoginAdminMessage extends TongWenMessage {
    constructor(
        public accountName: string,
        public passwordHash: string
    ) {
        super()
    }

    getAddress(): string {
        return ServiceConfig.getAdminServiceAddress()
    }
}
