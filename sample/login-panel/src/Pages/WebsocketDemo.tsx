import React, { useEffect, useRef, useState } from 'react'
import {initSSEConnection} from "Plugins/CommonUtils/Send/SSEConnection";
import {processSyncMessage} from "Utils/SSEFunction";

export const websocketPath= "/websocket";
export default function WebSocketDemo() {
    const [messages, setMessages] = useState<string[]>([])
    const wsRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        initSSEConnection(`http://127.0.0.1:10013/stream/book`, processSyncMessage)
    }, []);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:10013/ws')
        wsRef.current = ws

        ws.onopen = () => console.log('WebSocket 连接已建立')
        ws.onmessage = e => {
            console.log('收到消息：', e.data)
            setMessages(prev => [...prev, e.data])
        }
        ws.onerror = e => console.error('WebSocket 错误', e)
        ws.onclose = () => console.log('WebSocket 连接已关闭')

        return () => ws.close()
    }, [])

    const sendMessage = () => {
        wsRef.current?.send('Hello from Frontend!')
    }

    return (
        <div>
            <h2>WebSocket 测试</h2>
            <button onClick={sendMessage}>发送消息</button>
            <ul>
                {messages.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                ))}
            </ul>
        </div>
    )
}