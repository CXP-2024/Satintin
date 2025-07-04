/**
 * GetAssetTransactionMessage
 * desc: 获取用户的所有资产交易记录。
 * @param userToken: String (用户的认证令牌，用于身份验证。)
 * @return transactions: String (用户的所有交易记录，以JSON格式返回。)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import {ServiceConfig} from "../../../Globals/ServiceConfig";



export class GetAssetTransactionMessage extends TongWenMessage {
    constructor(
        public  userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getAssetServiceAddress()
    }
}
