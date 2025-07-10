/**
 * GetCardTemplateByIDMessage
 * desc: 根据卡牌ID获取卡牌模板信息
 * @param cardID: String (要查询的卡牌ID)
 * @return result: CardTemplate (卡牌模板信息，如果不存在则抛出异常)
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export class GetCardTemplateByIDMessage extends TongWenMessage {
    constructor(
        public cardID: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getCardServiceAddress()
    }
}
