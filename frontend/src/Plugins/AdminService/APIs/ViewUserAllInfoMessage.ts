import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'

/**
 * ViewUserAllInfoMessage
 * desc: 管理员查看用户完整信息，包括基本信息和资产状态
 * @param adminToken: string 管理员身份令牌，用于验证权限
 * @param userID: string 要查询的用户ID，可选，为空则返回所有用户
 * @return userAllInfo: string 用户完整信息列表的JSON字符串
 */
export class ViewUserAllInfoMessage extends TongWenMessage {
    constructor(
        public adminToken: string,
        public userID: string = "" // 空字符串表示查询所有用户
    ) {
        super()
        
        if (!adminToken || typeof adminToken !== 'string') {
            throw new Error('adminToken 必须是非空字符串');
        }
        
        // userID 可以为空，表示查询所有用户
        if (typeof userID !== 'string') {
            throw new Error('userID 必须是字符串');
        }
    }
    
    getAddress(): string {
        return "127.0.0.1:10013" // AdminService 端口
    }
}

// 定义返回的用户完整信息类型
export interface UserAllInfo {
    userID: string;
    username: string;
    banDays: number;
    isOnline: boolean;
    stoneAmount: number;
}

