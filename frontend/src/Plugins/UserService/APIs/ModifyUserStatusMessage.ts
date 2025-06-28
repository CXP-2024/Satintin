/**
 * ModifyUserStatusMessage
 * desc: 通过提供 userID 和新的封禁天数，更新用户的封禁字段。
 * @param userID: string (需要被修改状态的用户ID)
 * @param banDays: number (新的封禁天数)
 * @return result: string (修改状态的结果信息)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class ModifyUserStatusMessage extends TongWenMessage {
    constructor(
        public  userID: string,
        public  banDays: number
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

