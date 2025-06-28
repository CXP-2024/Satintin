/**
 * BlackEntry
 * desc: 黑名单条目信息
 * @param blackUserID: String (被加入黑名单的用户ID)
 */
import { Serializable } from 'Plugins/CommonUtils/Send/Serializable'




export class BlackEntry extends Serializable {
    constructor(
        public  blackUserID: string
    ) {
        super()
    }
}


