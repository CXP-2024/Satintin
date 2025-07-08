/**
 * GetAllCardTemplatesMessage
 * desc: 获取全部卡牌模板信息，用于展示所有可用的卡牌。
 * @param userID: String (用户认证的令牌，用于验证用户身份。)
 * @return result: String (JSON格式的卡牌模板列表)
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export class GetAllCardTemplatesMessage extends TongWenMessage {
    constructor() {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getCardServiceAddress()
    }
}
