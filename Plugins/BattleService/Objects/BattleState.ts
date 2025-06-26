/**
 * BattleState
 * desc: 战斗状态信息，包括当前轮次、阶段和玩家状态等内容
 * @param currentRound: Int (当前的轮次)
 * @param roundPhase: String (当前轮的阶段)
 * @param remainingTime: Int (当前阶段剩余时间)
 * @param playerOneStatus: PlayerStatus (一号玩家的状态信息)
 * @param playerTwoStatus: PlayerStatus:1092 (二号玩家的状态信息)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'

import { PlayerStatus } from 'Plugins/BattleService/Objects/PlayerStatus';


export class BattleState extends Serializable {
    constructor(
        public  currentRound: number,
        public  roundPhase: string,
        public  remainingTime: number,
        public  playerOneStatus: PlayerStatus,
        public  playerTwoStatus: PlayerStatus
    ) {
        super()
    }
}


