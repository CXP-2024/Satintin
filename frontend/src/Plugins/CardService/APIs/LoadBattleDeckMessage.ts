/**
 * LoadBattleDeckMessage
 * desc: 加载用户的战斗卡组配置
 * @param userID: String (用户的身份令牌，用于验证用户身份)
 * @return battleDeck: string[] (用户配置的战斗卡组，包含cardID列表)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export class LoadBattleDeckMessage extends TongWenMessage {
    constructor(
        public userID: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getCardServiceAddress()
    }
}
