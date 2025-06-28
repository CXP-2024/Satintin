/**
 * QueryAssetStatusMessage
 * desc: 返回用户当前的原石数量。处理查询资产状态的需求。
 * @param userToken: String (用户凭证，用于验证用户身份的合法性)
 * @return stoneAmount: Int (用户当前的原石数量)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class QueryAssetStatusMessage extends TongWenMessage {
    constructor(
        public  userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10012"
    }
}

