/**
 * ValidateUserTokenMessage
 * desc: 验证用户Token并获取用户ID的API
 * @param userToken 用户登录Token
 * @return userID 对应的用户ID
 */

import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'

export class ValidateUserTokenMessage extends TongWenMessage {
    constructor(
        public userToken: string
    ) {
        super()
    }

   getAddress(): string {
        return "127.0.0.1:10010"
    }
}
