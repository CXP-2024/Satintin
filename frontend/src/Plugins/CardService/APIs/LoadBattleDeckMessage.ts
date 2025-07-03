/**
 * LoadBattleDeckMessage
 * desc: 加载用户的战斗卡组配置
 * @param userToken: String (用户的身份令牌，用于验证用户身份)
 * @return battleDeck: string[] (用户配置的战斗卡组，包含cardID列表)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'

export class LoadBattleDeckMessage extends TongWenMessage {
    constructor(
        public userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10011"
    }
}
