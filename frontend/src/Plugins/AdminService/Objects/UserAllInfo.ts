/**
 * UserAllInfo
 * desc: 用户完整信息，包括基本信息和资产状态
 * @param userID: string 用户ID
 * @param username: string 用户名
 * @param banDays: number 封禁天数
 * @param isOnline: boolean 在线状态
 * @param stoneAmount: number 原石数量
 */
export class UserAllInfo {
    constructor(
        public userID: string,
        public username: string,
        public banDays: number,
        public isOnline: boolean,
        public stoneAmount: number
    ) {}
}