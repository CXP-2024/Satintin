/**
 * SubmitPlayerActionMessage
 * desc: 根据房间ID记录玩家的行动类型及相关信息，用于处理玩家行动的需求。
 * @param userToken: String (用户的鉴权Token，用于确认用户身份)
 * @param roomID: String (目标房间的唯一标识符)
 * @param actionType: String (用户行为类型，例如撒、饼、防)
 * @param targetID: String (可选的目标玩家ID，只有部分行为需要用到此参数)
 * @return result: String (行为提交结果，例如 '行动已提交！')
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class SubmitPlayerActionMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  roomID: string,
        public  actionType: string,
        public  targetID: string | null
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10014"
    }
}

