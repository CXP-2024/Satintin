import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'

/**
 * CheatingReport
 * desc: 举报信息，包含举报的用户、被举报的用户及相关详情。
 * @param reportID: string (举报的唯一ID)
 * @param reportingUserID: string (举报发起者的用户ID)
 * @param reportedUserID: string (被举报的用户ID)
 * @param reportReason: string (举报的原因)
 * @param isResolved: boolean (举报是否已经解决)
 * @param reportTime: number (举报提交的时间戳)
 */
export class CheatingReport extends Serializable {
    constructor(
        public reportID: string,
        public reportingUserID: string,
        public reportedUserID: string,
        public reportReason: string,
        public isResolved: boolean,
        public reportTime: number  // Unix timestamp
    ) {
        super()
    }

    /**
     * 获取格式化的举报时间
     */
    getFormattedTime(): string {
        return new Date(this.reportTime).toLocaleString()
    }

    /**
     * 获取举报状态文本
     */
    getStatusText(): string {
        return this.isResolved ? "已处理" : "未处理"
    }
}


