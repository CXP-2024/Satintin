/**
 * RewardAssetByIDMessage
 * desc: 管理员根据用户ID为指定用户增加原石奖励
 * @param adminToken: String (管理员身份认证令牌，用于验证管理员权限)
 * @param userID: String (要奖励的用户ID)
 * @param rewardAmount: Number (奖励的原石数量，必须大于0)
 * @return result: String (操作结果的描述信息，例如"管理员奖励发放成功！")
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'

export class RewardAssetByIDMessage extends TongWenMessage {
    constructor(
        public adminToken: string,
        public userID: string,
        public rewardAmount: number
    ) {
        super()
    }
    
    getAddress(): string {
        return "127.0.0.1:10013"
    }
}