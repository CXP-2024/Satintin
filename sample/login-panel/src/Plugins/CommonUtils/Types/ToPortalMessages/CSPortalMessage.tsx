import { getPublicKeySnap } from 'Plugins/CommonUtils/Encryption/EncryptionStore'
import { getMacAddressIDSnap } from 'Plugins/CommonUtils/Store/GetMacAddressStore'
import { getUserTokenSnap } from 'Plugins/CommonUtils/Store/UserInfoStore'
import { PortalMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

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
