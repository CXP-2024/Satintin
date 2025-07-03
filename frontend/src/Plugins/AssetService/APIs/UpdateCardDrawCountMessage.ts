/**
 * UpdateCardDrawCountMessage
 * desc: 设置用户在指定卡池的抽卡次数记录
 * @param userToken: String (用户的身份令牌，用于验证用户身份)
 * @param poolType: String (卡池类型，"standard"为标准池，"featured"为限定池)
 * @param drawCount: Int (要设置的抽卡次数数值)
 * @return result: String (操作结果信息，例如'抽卡次数更新成功！')
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'

export class UpdateCardDrawCountMessage extends TongWenMessage {
    constructor(
        public userToken: string,
        public poolType: string,
        public drawCount: number
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10012"
    }
}
