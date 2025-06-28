/**
 * AssetTransaction
 * desc: 用户的资产交易记录
 * @param transactionID: String (交易的唯一标识符)
 * @param userID: String (用户的唯一标识符)
 * @param transactionType: String (交易类型，比如收入或支出)
 * @param changeAmount: Int (交易影响的资产数量变化)
 * @param changeReason: String (交易变化的原因说明)
 * @param timestamp: DateTime (交易发生的时间戳)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'




export class AssetTransaction extends Serializable {
    constructor(
        public  transactionID: string,
        public  userID: string,
        public  transactionType: string,
        public  changeAmount: number,
        public  changeReason: string,
        public  timestamp: number
    ) {
        super()
    }
}


