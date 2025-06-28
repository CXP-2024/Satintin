import { getUserTokenSnap } from 'Plugins/CommonUtils/Store/UserInfoStore'
import { getMacAddressIDSnap } from 'Plugins/CommonUtils/Store/GetMacAddressStore'
import { PortalMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

export class DashboardMessage extends PortalMessage {
    userToken: string
    macAddress: string

    constructor() {
        super()
        this.userToken = getUserTokenSnap()
        this.macAddress = getMacAddressIDSnap()
    }
}
