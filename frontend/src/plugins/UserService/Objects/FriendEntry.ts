/**
 * FriendEntry
 * desc: 用户好友的基本信息
 * @param friendID: String (好友的唯一ID)
 */
import { Serializable } from '@/plugins/CommonUtils/Send/Serializable'




export class FriendEntry extends Serializable {
    constructor(
        public friendID: string
    ) {
        super()
    }
}


