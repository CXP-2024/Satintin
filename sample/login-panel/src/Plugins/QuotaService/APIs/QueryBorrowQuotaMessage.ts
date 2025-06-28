/**
 * QueryBorrowQuotaMessage
 * desc: 查询用户配额，用于配额管理
 * @param userToken: String (用户的认证Token，用于验证用户身份和权限)
 * @return quotaDetails: BorrowQuota:2088 (用户在不同类别下的配额详情)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class QueryBorrowQuotaMessage extends TongWenMessage {
    constructor(
        public  userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10011"
    }
}

