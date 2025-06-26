import { getUserTokenSnap } from '@/plugins/CommonUtils/Store/UserInfoStore'
import { PortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

export class TongWenPortalMessage extends PortalMessage {
    userToken: string

    constructor() {
        super()
        this.userToken = getUserTokenSnap()
    }
}
