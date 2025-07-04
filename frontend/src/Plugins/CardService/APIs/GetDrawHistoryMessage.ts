/**
 * GetDrawHistoryMessage
 * desc: 根据用户Token查询抽卡历史，返回所有获得的卡、抽取时间与卡池类型。
 * @param userToken: string (用户的身份令牌，用于验证用户的合法性。)
 * @return drawHistory: DrawHistoryEntry[] (用户的抽卡历史记录列表)
 */

import { TongWenMessage } from '../../../Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export interface DrawHistoryEntry {
    drawId: string;
    cardId: string;  // 修改为 string 类型
    cardName: string;
    cardDescription: string;
    rarity: string;
    cardType: string;
    drawTime: string; // ISO date string
    poolType: string;
}

export class GetDrawHistoryMessage extends TongWenMessage {
    constructor(
        public userToken: string
    ) {
        super()
    }
    
    getAddress(): string {
        return ServiceConfig.getCardServiceAddress()
    }
}
