import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'

export class ViewAllReportsMessage extends TongWenMessage {
    constructor(
        public adminToken: string
    ) {
        super()
    }
    
    getAddress(): string {
        return "127.0.0.1:10013"
    }
}