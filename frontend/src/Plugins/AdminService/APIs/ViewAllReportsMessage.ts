import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export class ViewAllReportsMessage extends TongWenMessage {
    constructor(
        public adminToken: string
    ) {
        super()
    }
    
    getAddress(): string {
        return ServiceConfig.getAdminServiceAddress()
    }
}
