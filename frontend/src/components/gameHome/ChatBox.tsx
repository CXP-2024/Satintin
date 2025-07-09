import React, { useState, useRef, useEffect } from 'react';
import './ChatBox.css';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: Date;
    isCurrentUser: boolean;
}

interface ChatBoxProps {
    friendId: string;
    friendName: string;
    onClose: () => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ friendId, friendName, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mock data for demonstration
    useEffect(() => {
        const mockMessages: Message[] = [
            {
                id: '1',
                senderId: friendId,
                senderName: friendName,
                content: '嗨！你在吗？',
                timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                isCurrentUser: false
            },
            {
                id: '2',
                senderId: 'currentUser',
                senderName: '我',
                content: '在的！刚刚在玩游戏',
                timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
                isCurrentUser: true
            },
            {
                id: '3',
                senderId: friendId,
                senderName: friendName,
                content: '哈哈，我也是！今天运气怎么样？',
                timestamp: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
                isCurrentUser: false
            },
            {
                id: '4',
                senderId: 'currentUser',
                senderName: '我',
                content: '还不错！抽到了几张不错的卡牌',
                timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
                isCurrentUser: true
            },
            {
                id: '5',
                senderId: friendId,
                senderName: friendName,
                content: '羡慕！要不要来对战一局？',
                timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
                isCurrentUser: false
            },
            {
                id: '6',
                senderId: 'currentUser',
                senderName: '我',
                content: '好啊！等我整理一下卡组',
                timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
                isCurrentUser: true
            }
        ];
        setMessages(mockMessages);
    }, [friendId, friendName]);

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const message: Message = {
                id: Date.now().toString(),
                senderId: 'currentUser',
                senderName: '我',
                content: newMessage.trim(),
                timestamp: new Date(),
                isCurrentUser: true
            };
            setMessages(prev => [...prev, message]);
            setNewMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (timestamp: Date) => {
        return timestamp.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const formatDate = (timestamp: Date) => {
        const today = new Date();
        const messageDate = new Date(timestamp);
        
        if (messageDate.toDateString() === today.toDateString()) {
            return '今天';
        } else {
            return messageDate.toLocaleDateString('zh-CN', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    };

    return (
        <div className="chatbox-overlay">
            <div className="chatbox-container">
                <div className="chatbox-header">
                    <div className="chatbox-friend-info">
                        <div className="chatbox-avatar">
                            {friendName.charAt(0).toUpperCase()}
                        </div>
                        <div className="chatbox-friend-details">
                            <h3>{friendName}</h3>
                            <span className="online-status">在线</span>
                        </div>
                    </div>
                    <button className="chatbox-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="chatbox-messages">
                    {messages.map((message, index) => {
                        const showDate = index === 0 || 
                            formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
                        
                        return (
                            <div key={message.id}>
                                {showDate && (
                                    <div className="message-date">
                                        {formatDate(message.timestamp)}
                                    </div>
                                )}
                                <div className={`message ${message.isCurrentUser ? 'message-sent' : 'message-received'}`}>
                                    <div className="message-content">
                                        {message.content}
                                    </div>
                                    <div className="message-time">
                                        {formatTime(message.timestamp)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chatbox-input">
                    <div className="input-container">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="输入消息..."
                            rows={1}
                            className="message-input"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="send-btn"
                        >
                            发送
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;
