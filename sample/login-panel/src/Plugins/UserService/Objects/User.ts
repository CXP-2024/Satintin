/**
 * User
 * desc: 用户信息
 * @param userID: String (用户的唯一ID)
 * @param name: String (用户姓名)
 * @param idCard: String (用户身份证号)
 * @param phoneNumber: String (用户手机号)
 * @param role: UserRole:1069 (用户角色)
 * @param createdAt: DateTime (用户信息创建时间)
 * @param updatedAt: DateTime (用户信息更新时间)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'

import { UserRole } from 'Plugins/UserService/Objects/UserRole';


export class User extends Serializable {
    constructor(
        public  userID: string,
        public  name: string,
        public  idCard: string,
        public  phoneNumber: string,
        public  role: UserRole,
        public  createdAt: number,
        public  updatedAt: number
    ) {
        super()
    }
}


