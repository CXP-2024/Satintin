/**
 * CheatingReport
 * desc: 举报信息，包含举报的用户、被举报的用户及相关详情。
 * @param reportID: String (举报的唯一ID)
 * @param reportingUserID: String (举报发起者的用户ID)
 * @param reportedUserID: String (被举报的用户ID)
 * @param reportReason: String (举报的原因)
 * @param isResolved: Boolean (举报是否已经解决)
 * @param reportTime: DateTime (举报提交的时间)
 */
import { Serializable } from '@/plugins/CommonUtils/Send/Serializable'




export class CheatingReport extends Serializable {
    constructor(
        public reportID: string,
        public reportingUserID: string,
        public reportedUserID: string,
        public reportReason: string,
        public isResolved: boolean,
        public reportTime: number
    ) {
        super()
    }
}


