/**
 * DrawCardMessage
 * desc: 根据原石数量扣减相关资产并返回抽卡结果。
 * @param userID: String (用户认证用的token，标识当前用户身份)
 * @param drawCount: Int (抽取卡牌的次数)
 * @param poolType: String (卡池类型：featured/standard，必填)
 * @return drawResult: DrawResult:1062 (抽卡结果数据，包含抽到的卡牌信息和是否有新卡)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class DrawCardMessage extends TongWenMessage {
    constructor(
        public  userID: string,
        public  drawCount: number,
        public  poolType: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getCardServiceAddress()
    }
}

