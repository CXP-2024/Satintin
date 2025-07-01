export function processSyncMessage(event: MessageEvent) {
    return new Promise<void>((resolve, reject) => {
        try {
            console.log('收到SSE同步包：', event.data)
        } catch (e) {
            console.error('处理同步消息时发生错误：', e)
            reject(e)
        }
    })
}
