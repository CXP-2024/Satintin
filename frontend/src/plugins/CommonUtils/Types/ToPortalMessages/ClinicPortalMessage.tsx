import { serviceName } from 'Globals/GlobalVariables'
import { getUniqueIDSnap } from 'Plugins/CommonUtils/UniqueID'
import { getPublicKeySnap } from 'Plugins/CommonUtils/Encryption/EncryptionStore'
import { getMacAddressIDSnap } from 'Plugins/CommonUtils/Store/GetMacAddressStore'
// import { getUserTokenSnap } from 'Plugins/CommonUtils/Store/UserInfoStore'
import { PortalMessage } from 'Plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

export class ClinicPortalMessage extends PortalMessage {
    clinicToken: string
    userToken: string
    serviceName: string
    uniqueID: string
    clientPublicKey: string
    macAddress: string

    constructor() {
        super()
        this.clinicToken = ''
        this.userToken = '' //getUserTokenSnap()
        this.serviceName = serviceName
        this.uniqueID = getUniqueIDSnap()
        this.clientPublicKey = getPublicKeySnap()
        this.macAddress = getMacAddressIDSnap()
    }
}
