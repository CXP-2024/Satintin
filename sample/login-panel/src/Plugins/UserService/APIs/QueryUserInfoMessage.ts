/**
 * QueryUserInfoMessage
 * desc: 查询用户信息，用于管理员查看用户详情
 * @param userToken: String (管理员Token，用于验证请求者的身份和权限)
 * @param userID: String (待查询用户的唯一标识符)
 * @return user: User:1004 (指定用户的详细信息)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class QueryUserInfoMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  userID: string
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10012"
    }
}

