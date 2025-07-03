/**
 * UnbanUserMessage
 * desc: 根据用户ID取消其封禁状态，处理解封用户的需求。
 * @param adminToken: String (管理员身份Token，用于标识和验证管理员权限)
 * @param userID: String (需要解封的用户ID)
 * @return result: String (解封操作的结果信息，固定为'用户解封成功！')
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class UnbanUserMessage extends TongWenMessage {
    constructor(
        public  adminToken: string,
        public  userID: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getAdminServiceAddress()
    }
}

