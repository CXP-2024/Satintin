/**
 * CardEntry
 * desc: 卡牌的基本入口实体类
 * @param cardID: String (卡片的唯一ID)
 * @param rarityLevel: String (卡片稀有度评级)
 * @param cardLevel: Int (卡片等级)
 */
import { Serializable } from '@/plugins/CommonUtils/Send/Serializable'




export class CardEntry extends Serializable {
    constructor(
        public cardID: string,
        public rarityLevel: string,
        public cardLevel: number
    ) {
        super()
    }
}


