/**
 * UpdateCardDrawCountMessage
 * desc: 更新用户的抽卡次数记录
 * @param userToken: String (用户的身份令牌，用于验证用户身份)
 * @param drawCount: Int (抽卡次数数值)
 * @param isIncrement: Boolean (true为增加，false为设置，默认为true)
 * @return result: String (操作结果信息，例如'抽卡次数更新成功！')
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'

export class UpdateCardDrawCountMessage extends TongWenMessage {
    serviceName: string = 'Asset'
    
    constructor(
        public userToken: string,
        public drawCount: number,
        public isIncrement: boolean = true
    ) {
        super()
    }
}
