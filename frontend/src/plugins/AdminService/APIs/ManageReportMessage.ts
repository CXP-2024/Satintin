/**
 * ManageReportMessage
 * desc: 管理员处理举报记录并更新举报状态
 * @param adminToken: String (管理员登录凭证，用于验证其权限。)
 * @param reportID: String (需要处理的举报记录ID。)
 * @param resolutionStatus: String (举报处理结果状态，例如'已处理'或'未处理'。)
 * @return result: String (处理操作的结果字符串，表示是否成功完成。)
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'



export class ManageReportMessage extends TongWenMessage {
    constructor(
        public adminToken: string,
        public reportID: string,
        public resolutionStatus: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10013"
    }
}

