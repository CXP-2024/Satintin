/**
 * CardEntry
 * desc: 卡牌的基本入口实体类
 * @param userCardID: String (用户卡牌的唯一ID)
 * @param cardID: String (卡片的唯一ID)
 * @param rarityLevel: String (卡片稀有度评级)
 * @param cardLevel: Int (卡片等级)
 * @param cardName: String (卡牌名称，从模板表获取)
 * @param description: String (卡牌描述，从模板表获取)
 * @param cardType: String (卡牌类型，从模板表获取)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'




export class CardEntry extends Serializable {
    constructor(
        public  userCardID: string,
        public  cardID: string,
        public  rarityLevel: string,
        public  cardLevel: number,
        public  cardName: string,
        public  description: string,
        public  cardType: string
    ) {
        super()
    }
}


