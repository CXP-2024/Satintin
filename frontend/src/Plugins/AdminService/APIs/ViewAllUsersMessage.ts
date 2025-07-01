import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'

/**
 * ViewAllUsersMessage
 * 获取所有用户信息的API调用
 */
export class ViewAllUsersMessage extends TongWenMessage {
    constructor(
        public adminToken: string
    ) {
        super()
        
        if (!adminToken || typeof adminToken !== 'string') {
            throw new Error('adminToken 必须是非空字符串');
        }
    }
    
    getAddress(): string {
        return "127.0.0.1:10013"
    }
}