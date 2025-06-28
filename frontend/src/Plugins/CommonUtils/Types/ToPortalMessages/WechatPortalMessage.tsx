import { getUserTokenSnap } from 'Plugins/CommonUtils/Store/UserInfoStore'
import { PortalMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

export class WechatPortalMessage extends PortalMessage {
    userToken: string
    constructor() {
        super()
        this.userToken = getUserTokenSnap()
    }
}
