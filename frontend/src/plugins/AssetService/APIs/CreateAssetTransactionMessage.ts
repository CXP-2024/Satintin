/**
 * CreateAssetTransactionMessage
 * desc: 创建用户资产的变动记录，并实时更新资产状态。
 * @param userToken: String (用户的认证令牌，用于身份验证。)
 * @param transactionType: String (资产变动类型，例如充值、消费或奖励。)
 * @param changeAmount: Int (资产变动数量，正数表示增加，负数表示减少。)
 * @param changeReason: String (资产变动原因，例如购买物品或活动奖励。)
 * @return result: String (表示资产交易记录成功的信息。)
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'



export class CreateAssetTransactionMessage extends TongWenMessage {
    constructor(
        public userToken: string,
        public transactionType: string,
        public changeAmount: number,
        public changeReason: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10012"
    }
}

