/**
 * LogUserOperationMessage
 * desc: 记录用户的操作行为到用户行为日志中。
 * @param userToken: String (用户的身份令牌，用于验证其身份。)
 * @param actionType: String (用户行为的类型，如登录、登出等。)
 * @param actionDetail: String (详细描述用户操作行为的信息。)
 * @return result: String (结果提示字符串，例如'操作记录成功！'。)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class LogUserOperationMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  actionType: string,
        public  actionDetail: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

