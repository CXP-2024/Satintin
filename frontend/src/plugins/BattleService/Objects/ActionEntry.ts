/**
 * ActionEntry
 * desc: 战斗动作条目的基本信息
 * @param actionID: String (动作的唯一ID)
 * @param playerID: String (参与动作的玩家ID)
 * @param actionType: String (动作的类型)
 * @param targetID: String (动作作用目标的ID)
 */
import { Serializable } from '@/plugins/CommonUtils/Send/Serializable'




export class ActionEntry extends Serializable {
    constructor(
        public actionID: string,
        public playerID: string,
        public actionType: string,
        public targetID: string | null
    ) {
        super()
    }
}


