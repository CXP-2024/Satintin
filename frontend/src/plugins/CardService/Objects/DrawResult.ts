/**
 * DrawResult
 * desc: 抽卡结果信息，用于表示抽卡的结果详情
 * @param cardList: CardEntry:1124 (抽中卡牌的列表)
 * @param isNewCard: Boolean (是否是新抽到的卡牌)
 */
import { Serializable } from '@/plugins/CommonUtils/Send/Serializable'

import { CardEntry } from '@/plugins/CardService/Objects/CardEntry';


export class DrawResult extends Serializable {
    constructor(
        public cardList: CardEntry[],
        public isNewCard: boolean
    ) {
        super()
    }
}


