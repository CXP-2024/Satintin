export function getNextTestMessage(url: string): any {
    // 模拟测试消息
    console.log('🧪 [MockTest] 模拟请求:', url);
    return {
        status: 200,
        text: () => Promise.resolve('模拟响应')
    };
}