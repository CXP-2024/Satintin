import { Message } from 'Plugins/CommonUtils/Send/Serializable'

export abstract class PortalMessage extends Message {
    constructor() {
        super()
    }

    toMap(): Map<string, string> {
        return new Map<string, string>(Object.entries(this))
    }
}
