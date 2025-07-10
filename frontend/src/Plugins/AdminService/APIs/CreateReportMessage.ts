import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class CreateReportMessage extends TongWenMessage {
    constructor(
        public  userID : string,        
        public  reportedUserID: string,    
        public  reportReason: string    
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getAdminServiceAddress()
    }
}
