import { serviceName } from 'Globals/GlobalVariables'
import { getUniqueIDSnap } from '@/plugins/CommonUtils/UniqueID'
import { getPublicKeySnap } from '@/plugins/CommonUtils/Encryption/EncryptionStore'
import { getMacAddressIDSnap } from '@/plugins/CommonUtils/Store/GetMacAddressStore'
// import { getUserTokenSnap } from 'Plugins/CommonUtils/Store/UserInfoStore'
import { PortalMessage } from '@/plugins/CommonUtils/Types/ToPortalMessages/PortalMessage'

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
