import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ChatPage.css';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: Date;
    isCurrentUser: boolean;
}

interface LocationState {
    friendId: string;
    friendName: string;
}

const ChatPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 如果没有传递好友信息，返回主页
    useEffect(() => {
        if (!state?.friendId || !state?.friendName) {
            navigate('/game');
        }
    }, [state, navigate]);

    // Mock data for demonstration
    useEffect(() => {
        if (state?.friendId && state?.friendName) {
            const mockMessages: Message[] = [
                {
                    id: '1',
                    senderId: state.friendId,
                    senderName: state.friendName,
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
                    senderId: state.friendId,
                    senderName: state.friendName,
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
                    senderId: state.friendId,
                    senderName: state.friendName,
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
                },
                {
                    id: '7',
                    senderId: state.friendId,
                    senderName: state.friendName,
                    content: '没问题！我在等你',
                    timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
                    isCurrentUser: false
                }
            ];
            setMessages(mockMessages);
        }
    }, [state]);

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

    const handleGoBack = () => {
        navigate('/game');
    };

    if (!state?.friendId || !state?.friendName) {
        return null;
    }

    return (
        <div className="chat-page">
            <div className="chat-page-container">
                <div className="chat-page-header">
                    <button className="back-btn" onClick={handleGoBack}>
                        ← 返回
                    </button>
                    <div className="chat-page-friend-info">
                        <div className="chat-page-avatar">
                            {state.friendName.charAt(0).toUpperCase()}
                        </div>
                        <div className="chat-page-friend-details">
                            <h2>{state.friendName}</h2>
                            <span className="online-status">在线</span>
                        </div>
                    </div>
                    <div className="chat-actions">
                        <button className="action-btn video-call" title="视频通话">
                            📹
                        </button>
                        <button className="action-btn voice-call" title="语音通话">
                            📞
                        </button>
                        <button className="action-btn more-options" title="更多选项">
                            ⋯
                        </button>
                    </div>
                </div>

                <div className="chat-page-messages">
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

                <div className="chat-page-input">
                    <div className="input-wrapper">
                        <button className="emoji-btn" title="表情">
                            😊
                        </button>
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="输入消息..."
                            rows={1}
                            className="message-input"
                        />
                        <button className="attachment-btn" title="发送文件">
                            📎
                        </button>
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

export default ChatPage;
