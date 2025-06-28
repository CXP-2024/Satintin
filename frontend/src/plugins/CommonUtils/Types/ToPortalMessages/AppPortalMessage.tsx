import { getUserTokenSnap } from 'Plugins/CommonUtils/Store/UserInfoStore'
import { PortalMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

export class AppPortalMessage extends PortalMessage {
    userToken: string
    constructor() {
        super()
        this.userToken = getUserTokenSnap()
    }
}
