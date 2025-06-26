import { getUserTokenSnap } from '@/plugins/CommonUtils/Store/UserInfoStore'
import { PortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

export class WechatPortalMessage extends PortalMessage {
    userToken: string
    constructor() {
        super()
        this.userToken = getUserTokenSnap()
    }
}
