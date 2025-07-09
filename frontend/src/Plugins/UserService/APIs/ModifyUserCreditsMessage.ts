/**
 * ModifyUserCreditsMessage
 * desc: 修改用户的积分，并自动更新对应的段位信息
 * @param userID: String (需要修改积分的用户ID)
 * @param targetCredits: Int (目标积分值，必须大于等于0)
 * @return result: String (接口返回的操作结果信息，例如"积分更新成功")
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export class ModifyUserCreditsMessage extends TongWenMessage {
    constructor(
        public userID: string,
        public targetCredits: number
    ) {
        super()
    }

    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
} 