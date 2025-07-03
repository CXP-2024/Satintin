/**
 * QueryCardDrawCountMessage
 * desc: 查询用户的当前抽卡次数
 * @param userToken: String (用户的身份令牌，用于验证用户身份)
 * @return drawCount: Int (用户的当前抽卡次数)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export class QueryCardDrawCountMessage extends TongWenMessage {
    serviceName: string = 'Asset'
    
    constructor(
        public userToken: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getAssetServiceAddress()
    }
}
