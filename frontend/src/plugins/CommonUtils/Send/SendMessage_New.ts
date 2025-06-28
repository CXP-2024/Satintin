// 简化版的 SendMessage 实现，移除复杂依赖
import { API } from './API'

export async function sendMessage(infoMessage: API, timeout: number, isEncrypt: boolean): Promise<any> {
    try {
        const url = infoMessage.getURL()
        console.log('📡 [SendMessage] 发送请求到:', url)
        
        // 简化的请求体序列化，避免复杂的深拷贝
        const requestBody = JSON.stringify(infoMessage)
        console.log('📝 [SendMessage] 请求体:', requestBody)
        
        // 使用 AbortController 实现超时
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: requestBody,
                signal: controller.signal
            })
            
            clearTimeout(timeoutId)
            
            return {
                status: response.status,
                text: () => response.text()
            }
        } catch (fetchError) {
            clearTimeout(timeoutId)
            throw fetchError
        }
    } catch (error) {
        console.error('❌ [SendMessage] 发送失败:', error)
        throw error
    }
}