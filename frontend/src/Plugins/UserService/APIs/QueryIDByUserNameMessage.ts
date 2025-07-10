/**
 * QueryIDByUserNameMessage
 * desc: 根据用户名查询用户ID
 * @param username: String (用户名)
 * @return userID: String (用户的唯一标识ID，如果用户不存在则抛出异常)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'


export class QueryIDByUserNameMessage extends TongWenMessage {
    constructor(
        public  username: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
}
