import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'



export class CreateReportMessage extends TongWenMessage {
    constructor(
        public  userToken : string,        // ✅ Changed from "reportertoken"
        public  reportedUserID: string,    // ✅ Changed from "reporteduserID"
        public  reportReason: string       // ✅ Changed from "reportreason"
    ) {
        super()
    }
    getAddress(): string {
        return "127.0.0.1:10013"
    }
}