/**
 * RewardAssetMessage
 * desc: 增加用户的资产，并记录相关交易记录。处理奖励资产的需求。
 * @param userID : String (用户的身份令牌，用于验证用户身份。)
 * @param rewardAmount: Int (奖励的资产数量。)
 * @return result: String (操作结果的描述信息，例如“奖励发放成功！”。)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class RewardAssetMessage extends TongWenMessage {
    constructor(
        public  userID : string,
        public  rewardAmount: number
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getAssetServiceAddress()
    }
}

