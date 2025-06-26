import { getPublicKeySnap } from '@/plugins/CommonUtils/Encryption/EncryptionStore'
import { getMacAddressIDSnap } from '@/plugins/CommonUtils/Store/GetMacAddressStore'
import { getUserTokenSnap } from '@/plugins/CommonUtils/Store/UserInfoStore'
import { PortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

export class CSPortalMessage extends PortalMessage {
    userToken: string
    clientPublicKey: string
    macAddress: string
    constructor() {
        super()
        this.userToken = getUserTokenSnap()
        this.clientPublicKey = getPublicKeySnap()
        this.macAddress = getMacAddressIDSnap()
    }
}
