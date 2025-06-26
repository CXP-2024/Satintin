/**
 * CreateBattleRoomMessage
 * desc: 创建一个新的对战房间，并返回房间ID。用于处理创建对战房间的需求。
 * @param userToken: String (用户认证令牌，用于验证用户合法性。)
 * @return roomID: String (生成的对战房间ID。)
 */
import { TongWenMessage } from '../../TongWenAPI/TongWenMessage'



export class CreateBattleRoomMessage extends TongWenMessage {
    constructor(
        public userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10014"
    }
}

