/**
 * PlayerStatus
 * desc: 玩家状态，包含血量、能量、行动信息及未使用的卡牌
 * @param health: Int (玩家的血量)
 * @param energy: Int (玩家的能量)
 * @param actions: ActionEntry (玩家的行动信息)
 * @param unusedCards: CardEntry:1124 (玩家未使用的卡牌)
 */
import { Serializable } from '@/plugins/CommonUtils/Send/Serializable'

import { ActionEntry } from '@/plugins/BattleService/Objects/ActionEntry';
import { CardEntry } from '@/plugins/CardService/Objects/CardEntry';


export class PlayerStatus extends Serializable {
    constructor(
        public health: number,
        public energy: number,
        public actions: ActionEntry[],
        public unusedCards: CardEntry[]
    ) {
        super()
    }
}


