/**
 * DrawCardMessage
 * desc: 根据原石数量扣减相关资产并返回抽卡结果。
 * @param userToken: String (用户认证用的token，标识当前用户身份)
 * @param drawCount: Int (抽取卡牌的次数)
 * @return drawResult: DrawResult:1062 (抽卡结果数据，包含抽到的卡牌信息和是否有新卡)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class DrawCardMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  drawCount: number
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10011"
    }
}

