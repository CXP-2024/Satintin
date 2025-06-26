/**
 * ModifyUserInfoMessage
 * desc: 根据传入的用户ID及需要修改的字段，更新用户信息。
 * @param userToken: String (用户登录的身份标识，用于权限验证。)
 * @param userID: String (需要修改信息的用户ID。)
 * @param keys: String (待修改字段的名称列表，例如邮箱、用户名。)
 * @param values: String (待修改字段的新值列表，与keys顺序对应。)
 * @return result: String (接口返回的操作结果信息，例如“修改成功！”)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class ModifyUserInfoMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  userID: string,
        public  keys: string[],
        public  values: string[]
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10010"
    }
}

