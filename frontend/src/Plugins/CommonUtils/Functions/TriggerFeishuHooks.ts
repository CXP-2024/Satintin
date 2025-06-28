import { FeishuMessage } from 'Plugins/CommonUtils/Types/FeishuHooksMessage'
import { plainSendMessage } from 'Plugins/CommonUtils/Send/PlainSendMessage'

export const reportFeishuMessage = (message: FeishuMessage) => {
    plainSendMessage(
        'https://open.feishu.cn/open-apis/bot/v2/hook/9d40dedd-fcb8-4933-96a9-6d0ad091c8f3',
        message,
        10000
    )
}
