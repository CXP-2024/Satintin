/**
 * User
 * desc: 用户的基本信息，包括账户、权限、社交等相关数据
 * @param userID: String (用户的唯一ID)
 * @param userName: String (用户名)
 * @param passwordHash: String (用户密码的哈希值)
 * @param email: String (用户的电子邮箱)
 * @param phoneNumber: String (用户的手机号码)
 * @param registerTime: DateTime (用户注册的时间)
 * @param permissionLevel: Int (用户的权限等级)
 * @param banDays: Int (用户当前被封禁的天数)
 * @param isOnline: Boolean (用户是否在线)
 * @param matchStatus: String (用户当前的匹配状态)
 * @param stoneAmount: Int (用户拥有的石头数量)
 * @param credits: Int (用户的信用点数)
 * @param rank: String (用户的段位)
 * @param rankPosition: Int (用户在段位中的排名)
 * @param friendList: FriendEntry (用户的好友列表)
 * @param blackList: BlackEntry (用户的黑名单列表)
 * @param messageBox: MessageEntry:1022 (用户的消息盒子)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'

import { FriendEntry } from 'Plugins/UserService/Objects/FriendEntry';
import { BlackEntry } from 'Plugins/UserService/Objects/BlackEntry';
import { MessageEntry } from 'Plugins/UserService/Objects/MessageEntry';


export class User extends Serializable {
    constructor(
        public  userID: string,
        public  userName: string,
        public  passwordHash: string,
        public  email: string,
        public  phoneNumber: string,
        public  registerTime: number,
        public  permissionLevel: number,
        public  banDays: number,
        public  isOnline: boolean,
        public  matchStatus: string,
        public  stoneAmount: number,
        public  credits: number,
        public  rank: string,
        public  rankPosition: number,
        public  friendList: FriendEntry[],
        public  blackList: BlackEntry[],
        public  messageBox: MessageEntry[]
    ) {
        super()
    }
}


