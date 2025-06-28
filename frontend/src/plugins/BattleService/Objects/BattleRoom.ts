/**
 * BattleRoom
 * desc: 表示战斗房间的主要信息
 * @param roomID: String (房间的唯一标识)
 * @param playerOneID: String (玩家一的唯一标识)
 * @param playerTwoID: String (玩家二的唯一标识)
 * @param ownerID: String (房间主人的唯一标识)
 * @param currentTurnPlayer: String (当前轮到操作的玩家ID)
 * @param battleState: BattleState:1034 (战斗状态对象)
 * @param winnerID: String (获胜玩家的唯一标识)
 * @param createTime: DateTime (房间的创建时间)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'

import { BattleState } from 'Plugins/BattleService/Objects/BattleState';


export class BattleRoom extends Serializable {
    constructor(
        public  roomID: string,
        public  playerOneID: string,
        public  playerTwoID: string,
        public  ownerID: string,
        public  currentTurnPlayer: string,
        public  battleState: BattleState,
        public  winnerID: string,
        public  createTime: number
    ) {
        super()
    }
}


