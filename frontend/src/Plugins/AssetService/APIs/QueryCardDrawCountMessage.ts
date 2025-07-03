/**
 * QueryCardDrawCountMessage
 * desc: 查询用户的当前抽卡次数
 * @param userToken: String (用户的身份令牌，用于验证用户身份)
 * @return drawCount: Int (用户的当前抽卡次数)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'

export class QueryCardDrawCountMessage extends TongWenMessage {
    constructor(
        public userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10012"
    }
}
