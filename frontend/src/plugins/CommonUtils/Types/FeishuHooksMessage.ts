import { Message } from 'Plugins/CommonUtils/Send/Serializable'

class FeishuContent {
    text: string
}

export abstract class FeishuCardConfigBase {}

export class FeishuBugReportCardVariable extends FeishuCardConfigBase {
    constructor(
        public ProjectName: string,
        public ProjectLink: string,
        public branchName: string,
        public bugDesc: string,
        public imageCount: number,
        public repoAddr: string,
        public twPanelBranchName: string,
    ) {
        super()
    }
}

export class FeishuCardConfig {
    template_id: string
    template_version_name: string
    template_variable: FeishuCardConfigBase
    constructor(
        template_id: string,
        template_version_name: string,
        template_variable: FeishuCardConfigBase
    ) {
        this.template_id = template_id
        this.template_version_name = template_version_name
        this.template_variable = template_variable
    }
}

export class FeishuCard {
   constructor (
        public type: string,
        public data: FeishuCardConfig
   ){}
}

export abstract class FeishuMessage extends Message {}

export class FeishuCardMessageBody extends FeishuMessage {
    constructor(public msg_type: string, public card: FeishuCard) {
        super()
    }
}

export class FeishuHooksMessageBody extends FeishuMessage {
    constructor(public msg_type: string, public content: FeishuContent) {
        super()
    }
}
