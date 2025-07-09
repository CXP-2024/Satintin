/**
 * SetUserMatchStatusMessage
 * desc: 设置用户匹配状态。
 * @param userToken: String (用户的登录令牌，用于标识当前用户。)
 * @param matchStatus: String (匹配状态，例如'quick'或'ranked')
 * @return result: String (操作结果的返回信息)
 */
import { TongWenMessage } from 'Plugins/TongWenAPI/TongWenMessage'
import { ServiceConfig } from 'Globals/ServiceConfig'

export class SetUserMatchStatusMessage extends TongWenMessage {
    constructor(
        public  userToken: string,
        public  matchStatus: string
    ) {
        super()
    }
    getAddress(): string {
        return ServiceConfig.getUserServiceAddress()
    }
    
    // 重写send方法，处理返回结果中可能的空格问题
    send(onSuccess?: (result: any) => void, onFailure?: (error: any) => void): void {
        super.send(
            (result) => {
                // 如果返回的是字符串，去除前后空格
                if (typeof result === 'string') {
                    try {
                        // 尝试解析JSON
                        const parsedResult = JSON.parse(result);
                        if (typeof parsedResult === 'string') {
                            // 如果解析后还是字符串，去除空格
                            const trimmedResult = parsedResult.trim();
                            console.log('🔧 [SetUserMatchStatusMessage] 原始结果:', parsedResult, '处理后:', trimmedResult);
                            if (onSuccess) onSuccess(JSON.stringify(trimmedResult));
                            return;
                        }
                        // 如果不是字符串，直接返回
                        if (onSuccess) onSuccess(result);
                    } catch (e) {
                        // 如果解析失败，直接去除原始字符串的空格
                        const trimmedResult = result.trim();
                        console.log('🔧 [SetUserMatchStatusMessage] 解析失败，原始结果:', result, '处理后:', trimmedResult);
                        if (onSuccess) onSuccess(trimmedResult);
                    }
                } else {
                    // 不是字符串，直接返回
                    if (onSuccess) onSuccess(result);
                }
            },
            onFailure
        );
    }
}