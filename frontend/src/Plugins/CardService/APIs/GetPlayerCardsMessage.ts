/**
 * GetPlayerCardsMessage
 * desc: 根据用户ID返回用户所拥有的卡牌信息列表，处理查询玩家卡牌的需求。
 * @param userID: String (用户的身份令牌，用于验证用户的合法性。)
 * @return cardEntries: CardEntry:1124 (用户所拥有的卡牌列表，包含卡牌的基础信息与稀有度等数据。)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class GetPlayerCardsMessage extends TongWenMessage {
    constructor(
        public  userID: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getCardServiceAddress()
    }
}

