import { getUserTokenSnap } from '@/plugins/CommonUtils/Store/UserInfoStore'
import { getMacAddressIDSnap } from '@/plugins/CommonUtils/Store/GetMacAddressStore'
import { PortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

export class DashboardMessage extends PortalMessage {
    userToken: string
    macAddress: string

    constructor() {
        super()
        this.userToken = getUserTokenSnap()
        this.macAddress = getMacAddressIDSnap()
    }
}
