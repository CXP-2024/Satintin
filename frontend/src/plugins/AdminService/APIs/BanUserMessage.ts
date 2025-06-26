/**
 * BanUserMessage
 * desc: 根据用户ID设置其封禁天数或禁止状态
 * @param adminToken: String (管理员身份验证Token，用于保证操作权限)
 * @param userID: String (需要封禁的用户ID)
 * @param banDays: Int (封禁用户的天数)
 * @return result: String (操作成功的提示信息，例如'用户封禁成功！')
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'



export class BanUserMessage extends TongWenMessage {
    constructor(
        public adminToken: string,
        public userID: string,
        public banDays: number
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10013"
    }
}

