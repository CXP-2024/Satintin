/**
 * UserActionLog
 * desc: 用户行为日志信息
 * @param actionLogID: String (日志的唯一标识符)
 * @param userID: String (对应用户的唯一标识符)
 * @param actionType: String (用户行为的类型)
 * @param actionDetail: String (具体的行为详细描述)
 * @param actionTime: DateTime (行为的时间戳)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'




export class UserActionLog extends Serializable {
    constructor(
        public  actionLogID: string,
        public  userID: string,
        public  actionType: string,
        public  actionDetail: string,
        public  actionTime: number
    ) {
        super()
    }
}


