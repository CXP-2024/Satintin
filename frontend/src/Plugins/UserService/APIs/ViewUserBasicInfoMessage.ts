import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'

/**
 * ViewUserBasicInfoMessage
 * desc: 查询用户基本信息（用户名、ID、封禁天数、在线状态）
 * @param userID: string 要查询的用户ID，可选，为空则返回所有用户
 * @return userInfo: string 用户基本信息列表的JSON字符串
 */
export class ViewUserBasicInfoMessage extends TongWenMessage {
    constructor(
        public userID: string = "" // 空字符串表示查询所有用户
    ) {
        super()
        
        // userID 可以为空，表示查询所有用户
        if (typeof userID !== 'string') {
            throw new Error('userID 必须是字符串');
        }
    }
    
    getAddress(): string {
        return "127.0.0.1:10010" // UserService 端口
    }
}

// 定义返回的用户基本信息类型
export interface UserBasicInfo {
    userID: string;
    username: string;
    banDays: number;
    isOnline: boolean;
}