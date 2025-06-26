/**
 * ModifyUserStatusMessage
 * desc: 管理员通过提供userID和新的封禁天数，更新用户的封禁字段。
 * @param adminToken: String (管理员身份验证的Token)
 * @param userID: String (需要被修改状态的用户ID)
 * @param banDays: Int (新的封禁天数)
 * @return result: String (修改状态的结果信息 (如: '用户状态修改成功！'))
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'



export class ModifyUserStatusMessage extends TongWenMessage {
    constructor(
        public adminToken: string,
        public userID: string,
        public banDays: number
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

