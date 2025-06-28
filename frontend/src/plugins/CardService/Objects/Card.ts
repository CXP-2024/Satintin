/**
 * Card
 * desc: 卡片的基本信息
 * @param cardID: String (卡片的唯一ID)
 * @param cardName: String (卡片的名称)
 * @param rarity: String (卡片的稀有程度)
 * @param description: String (卡片的描述信息)
 * @param creationTime: DateTime (卡片创建的时间)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'




export class Card extends Serializable {
    constructor(
        public  cardID: string,
        public  cardName: string,
        public  rarity: string,
        public  description: string,
        public  creationTime: number
    ) {
        super()
    }
}


