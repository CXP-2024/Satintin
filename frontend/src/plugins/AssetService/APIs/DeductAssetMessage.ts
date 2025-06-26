/**
 * DeductAssetMessage
 * desc: 减少用户的资产并记录相关操作。处理扣除资产的需求。
 * @param userToken: String (用户的身份令牌，用于验证用户身份)
 * @param deductAmount: Int (需要扣减的资产数量)
 * @return result: String (操作结果信息，例如‘资产扣减成功！’)
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'



export class DeductAssetMessage extends TongWenMessage {
    constructor(
        public userToken: string,
        public deductAmount: number
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10012"
    }
}

