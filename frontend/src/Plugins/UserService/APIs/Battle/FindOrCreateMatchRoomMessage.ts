/**
 * FindOrCreateMatchRoomMessage
 * desc: 查找或创建匹配房间。
 * @param userID: String (用户ID，用于标识当前用户。)
 * @param matchType: String (匹配类型，例如'quick'或'ranked')
 * @return roomID: String (房间ID)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class FindOrCreateMatchRoomMessage extends TongWenMessage {
    constructor(
        public userID: string,
        public matchType: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
} 