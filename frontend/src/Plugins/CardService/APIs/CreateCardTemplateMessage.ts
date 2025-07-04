/**
 * CreateCardTemplateMessage
 * desc: 创建卡牌模板，插入到card_template_table
 * @param userToken: String (用户认证token)
 * @param cardName: String (卡牌名称)
 * @param rarity: String (卡牌稀有度，如普通、稀有、传说)
 * @param description: String (卡牌技能描述)
 * @param cardType: String (卡牌池类型：featured/standard/both，必填)
 * @return cardTemplateId: String (创建的卡牌模板ID)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export class CreateCardTemplateMessage extends TongWenMessage {
    constructor(
        public userToken: string,
        public cardName: string,
        public rarity: string,
        public description: string,
        public cardType: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getCardServiceAddress()
    }
}
