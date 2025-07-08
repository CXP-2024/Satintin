/**
 * QueryAssetStatusMessage
 * desc: 返回用户当前的原石数量。处理查询资产状态的需求。
 * @param userID : String (用户凭证，用于验证用户身份的合法性)
 * @return stoneAmount: Int (用户当前的原石数量)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class QueryAssetStatusMessage extends TongWenMessage {
    constructor(
        public  userID : string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getAssetServiceAddress()
    }
}

