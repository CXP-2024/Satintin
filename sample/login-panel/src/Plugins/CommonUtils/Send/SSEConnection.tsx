import { config } from 'Globals/Config'

let currentEventSource: EventSource | null = null

export const initSSEConnection = (url: string, onMessage: (e: MessageEvent) => Promise<void>, retries: number = 5) => {
    return new Promise<void>((resolve, reject) => {
        if (currentEventSource) {
            currentEventSource.close()
        }

        try {
            console.log('connecting...', url)
            currentEventSource = new EventSource(url)

            currentEventSource.onopen = () => {
                console.log('SSE连接已成功建立')
                resolve()
            }

            currentEventSource.onmessage = event => {
                console.log('SSE 收到消息:', event.data)
                onMessage(event).catch(error => {
                    console.error('处理消息时出错:', error)
                })
            }

            currentEventSource.onerror = event => {
                console.error('SSE连接错误:', event)
                if (retries > 0) {
                    console.log(`尝试重新连接... (剩余重试次数: ${retries})`)
                    currentEventSource?.close()
                    setTimeout(() => {
                        initSSEConnection(url, onMessage, retries - 1)
                            .then(resolve)
                            .catch(reject)
                    }, 500)
                } else {
                    currentEventSource?.close()
                    reject(new Error('达到最大重试次数，SSE连接失败'))
                }
            }

            const timeout = setTimeout(() => {
                if (currentEventSource?.readyState !== EventSource.OPEN) {
                    console.error('SSE连接超时')
                    currentEventSource?.close()
                    if (retries > 0) {
                        initSSEConnection(url, onMessage, retries - 1)
                            .then(resolve)
                            .catch(reject)
                    } else {
                        reject(new Error('连接超时，SSE连接失败'))
                    }
                }
            }, 10000)

            currentEventSource.onopen = () => {
                clearTimeout(timeout)
                console.log('SSE连接已成功建立')
                resolve()
            }
        } catch (e) {
            console.error(`SSE连接异常:`, e)
            reject(e)
        }
    })
}

// 判断SSE的状态，处理重连的逻辑。 这个对于热更新刷新，之后非常用
export const ensureSSEConnection = async (
    projectID: string,
    processSyncMessage: (e: MessageEvent) => Promise<void>
): Promise<void> => {
    // const eventSource = getCurrentEventSourceSnap()

    if (currentEventSource) {
        switch (currentEventSource.readyState) {
            case EventSource.CONNECTING:
                console.log('SSE 状态: 正在连接中...')
                return // 正在连接，无需重新创建
            case EventSource.OPEN:
                console.log('SSE 状态: 已连接')
                return // 已连接，无需重新创建
            case EventSource.CLOSED:
                console.log('SSE 状态: 已断开，重新连接...')
                break // 断开状态，重新创建连接
            default:
                console.log('SSE 状态: 未知，尝试重新连接...')
                break // 未知状态，重新创建连接
        }
    } else {
        console.log('SSE 连接尚未初始化，正在初始化...')
    }

    // 如果状态不是 OPEN 或 CONNECTING，则重新创建 SSE 连接
    await initSSEConnection(`http://${config.hubURL}/stream/${projectID}`, processSyncMessage)
}
