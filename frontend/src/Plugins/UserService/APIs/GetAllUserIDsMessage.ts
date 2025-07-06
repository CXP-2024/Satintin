/**
 * GetAllUserIDsMessage
 * desc: 获取所有用户的ID列表
 * @return userIDs: List[String] (所有用户的ID列表)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export class GetAllUserIDsMessage extends TongWenMessage {
    constructor() {
        super()
    }
    
    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
}
