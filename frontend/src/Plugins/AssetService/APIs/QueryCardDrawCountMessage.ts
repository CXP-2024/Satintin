/**
 * QueryCardDrawCountMessage
 * desc: 查询用户在指定卡池的当前抽卡次数
 * @param userID : String (用户的身份令牌，用于验证用户身份)
 * @param poolType: String (卡池类型，"standard"为标准池，"featured"为限定池)
 * @return drawCount: Int (用户在指定卡池的当前抽卡次数)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export class QueryCardDrawCountMessage extends TongWenMessage {
    constructor(
        public userID : string,
        public poolType: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getAssetServiceAddress()
    }
}
