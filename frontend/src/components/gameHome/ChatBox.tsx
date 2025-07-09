import React, { useState, useRef, useEffect } from 'react';
import './ChatBox.css';
import { GetChatHistoryMessage } from '../../Plugins/UserService/APIs/GetChatHistoryMessage';
import { SendMessageMessage } from '../../Plugins/UserService/APIs/SendMessageMessage';
import {  getUserIDSnap, getUserInfo } from '../../Plugins/CommonUtils/Store/UserInfoStore';

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
    isVisible: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ friendId, friendName, onClose, isVisible }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 加载真实的聊天数据
    useEffect(() => {
        if (isVisible && friendId && friendName) {
            loadChatHistory();
        }
    }, [isVisible, friendId, friendName]);

    const loadChatHistory = async () => {
        if (isRefreshing) return;
        
        setIsRefreshing(true);
        try {
            const userID = getUserInfo().userID;
            if (!userID) {
                console.error('用户未登录');
                return;
            }

            new GetChatHistoryMessage(userID, friendId).send(
                    (responseText: string) => {
                    try {
                        const response = JSON.parse(responseText);
                        
                        if (!Array.isArray(response)) {
                            console.error('响应数据不是数组格式:', response);
                            setMessages([]);
                            return;
                        }

                        const currentUserID = getUserIDSnap();
                        const convertedMessages: Message[] = response.map((msg: any, index: number) => ({
                            id: `${index + 1}`,
                            senderId: msg.messageSource,
                            senderName: msg.messageSource === currentUserID ? '我' : friendName,
                            content: msg.messageContent,
                            timestamp: new Date(msg.messageTime),
                            isCurrentUser: msg.messageSource === currentUserID
                        }));
                        setMessages(convertedMessages);
                    } catch (parseError) {
                        console.error('解析聊天记录失败:', parseError, '原始响应:', responseText);
                        setMessages([]);
                    }
                },
                (error: string) => {
                    console.error('加载聊天记录失败:', error);
                    setMessages([]);
                }
            )
        } catch (error) {
            console.error('加载聊天记录出错:', error);
            setMessages([]);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleRefreshChat = async () => {
        console.log('🔄 Refreshing chat history...');
        await loadChatHistory();
    };

    useEffect(() => {
        if (!isMinimized) {
            scrollToBottom();
        }
    }, [messages, isMinimized]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (newMessage.trim()) {
            const userID = getUserInfo().userID;
            const currentUserID = getUserIDSnap();
            
            if (!userID || !currentUserID) {
                console.error('用户未登录');
                return;
            }

            const localMessage: Message = {
                id: Date.now().toString(),
                senderId: currentUserID,
                senderName: '我',
                content: newMessage.trim(),
                timestamp: new Date(),
                isCurrentUser: true
            };
            setMessages(prev => [...prev, localMessage]);
            const messageContent = newMessage.trim();
            setNewMessage('');

            try {
                new SendMessageMessage(userID, friendId, messageContent).send(
                    (response: string) => {
                        console.log('消息发送成功:', response);
                    },
                    (error: string) => {
                        console.error('消息发送失败:', error);
                    }
                );
            } catch (error) {
                console.error('发送消息出错:', error);
            }
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

    const handleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <>
            {/* 背景模糊层 */}
            <div className="chatbox-blur-overlay" onClick={onClose} />
            
            {/* 聊天框 */}
            <div className={`chatbox-floating-container ${isMinimized ? 'minimized' : ''}`}>
                <div className="chatbox-floating-header">
                    <div className="chatbox-floating-friend-info">
                        <div className="chatbox-floating-avatar">
                            {friendName.charAt(0).toUpperCase()}
                        </div>
                        <div className="chatbox-floating-friend-details">
                            <h4>{friendName}</h4>
                            <span className="chatbox-floating-online-status">在线</span>
                        </div>
                    </div>
                    <div className="chatbox-floating-actions">
                        <button 
                            className={`chatbox-action-btn refresh-btn ${isRefreshing ? 'loading' : ''}`}
                            onClick={handleRefreshChat}
                            disabled={isRefreshing}
                            title="刷新聊天记录"
                        >
                            <svg 
                                className="refresh-icon" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2"
                            >
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="m20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                            </svg>
                        </button>
                        <button 
                            className="chatbox-action-btn minimize-btn" 
                            onClick={handleMinimize}
                            title={isMinimized ? '展开' : '最小化'}
                        >
                            {isMinimized ? '🔼' : '🔽'}
                        </button>
                        <button 
                            className="chatbox-action-btn close-btn" 
                            onClick={onClose}
                            title="关闭"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        <div className="chatbox-floating-messages">
                            {messages.length === 0 ? (
                                <div className="empty-chatbox-floating-state">
                                    <div className="empty-chatbox-floating-icon">💬</div>
                                    <div className="empty-chatbox-floating-text">
                                        <h5>开始对话吧！</h5>
                                        <p>与 {friendName} 开始聊天</p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((message, index) => {
                                    const showDate = index === 0 || 
                                        formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);                                    
                                    return (
                                        <div key={message.id}>
                                            {showDate && (
                                                <div className="chatbox-floating-message-date">
                                                    {formatDate(message.timestamp)}
                                                </div>
                                            )}
                                            <div className={`chatbox-floating-message ${message.isCurrentUser ? 'chatbox-floating-message-sent' : 'chatbox-floating-message-received'}`}>
                                                <div className="chatbox-floating-message-content">
                                                    {message.content}
                                                </div>
                                                <div className="chatbox-floating-message-time">
                                                    {formatTime(message.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="chatbox-floating-input">
                            <div className="chatbox-floating-input-wrapper">
                                <button className="chatbox-floating-emoji-btn" title="表情">
                                    😊
                                </button>
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="输入消息..."
                                    rows={1}
                                    className="chatbox-floating-message-input"
                                />
                                <button className="chatbox-floating-attachment-btn" title="发送文件">
                                    📎
                                </button>
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim()}
                                    className="chatbox-floating-send-btn"
                                >
                                    发送
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};
export default ChatBox;