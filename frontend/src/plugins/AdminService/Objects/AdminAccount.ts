/**
 * AdminAccount
 * desc: 管理员账户信息
 * @param adminID: String (管理员唯一ID)
 * @param accountName: String (管理员账户名称)
 * @param passwordHash: String (管理员账户密码的哈希值)
 * @param createTime: DateTime (账户创建时间)
 */
import { Serializable } from '@/plugins/CommonUtils/Send/Serializable'




export class AdminAccount extends Serializable {
    constructor(
        public adminID: string,
        public accountName: string,
        public passwordHash: string,
        public createTime: number
    ) {
        super()
    }
}


