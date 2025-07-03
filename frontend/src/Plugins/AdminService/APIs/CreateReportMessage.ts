import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'



export class CreateReportMessage extends TongWenMessage {
    constructor(
        public  userToken : string,        // ✅ Changed from "reportertoken"
        public  reportedUserID: string,    // ✅ Changed from "reporteduserID"
        public  reportReason: string       // ✅ Changed from "reportreason"
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getAdminServiceAddress()
    }
}
