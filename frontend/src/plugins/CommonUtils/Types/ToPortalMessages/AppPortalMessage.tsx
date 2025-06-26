import { getUserTokenSnap } from '@/plugins/CommonUtils/Store/UserInfoStore'
import { PortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

export class AppPortalMessage extends PortalMessage {
    userToken: string
    constructor() {
        super()
        this.userToken = getUserTokenSnap()
    }
}
