import React, { useEffect } from 'react';
import './ChatBox.css';
import {
    Message,
    useChatBoxDrag,
    useChatBoxMessages,
    useChatBoxUI,
    formatTime,
    formatDate
} from './ChatBoxHooks';

interface ChatBoxProps {
    friendId: string;
    friendName: string;
    onClose: () => void;
    isVisible: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ friendId, friendName, onClose, isVisible }) => {
    // 使用UI状态管理hook
    const { isMinimized, handleMinimize } = useChatBoxUI();

    // 使用拖拽hook（传入isMinimized参数）
    const { isDragging, isResizing, position, size, chatBoxRef, headerRef, handleMouseDown, handleResizeMouseDown } = useChatBoxDrag(isMinimized);

    // 使用消息管理hook
    const {
        messages,
        newMessage,
        setNewMessage,
        isRefreshing,
        autoRefreshEnabled,
        messagesEndRef,
        handleRefreshChat,
        scrollToBottom,
        handleSendMessage,
        handleKeyPress,
        toggleAutoRefresh,
        enableAutoRefresh,
        disableAutoRefresh
    } = useChatBoxMessages(friendId, friendName, isVisible);

    // 滚动到底部
    useEffect(() => {
        if (!isMinimized) {
            scrollToBottom();
        }
    }, [messages, isMinimized, scrollToBottom]);

    if (!isVisible) {
        return null;
    }

    return (
        <>
            {/* 聊天框 - 移除背景模糊层，使其与房间共存 */}
            <div
                ref={chatBoxRef}
                className={`chatbox-floating-container ${isMinimized ? 'minimized' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: `${size.width}px`,
                    height: isMinimized ? '60px' : `${size.height}px`,
                    right: 'auto',
                    bottom: 'auto'
                }}
            >
                <div
                    ref={headerRef}
                    className="chatbox-floating-header"
                    onMouseDown={handleMouseDown}
                >
                    <div className="chatbox-floating-friend-info">
                        <div className="chatbox-floating-avatar">
                            {friendName.charAt(0).toUpperCase()}
                        </div>
                        <div className="chatbox-floating-friend-details">
                            <h4>{friendName}</h4>
                            <span className="chatbox-floating-online-status">
                                在线
                                {autoRefreshEnabled && (
                                    <span className="chatbox-auto-refresh-indicator" title="自动刷新已启用">
                                        •
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="chatbox-floating-actions">
                        <button
                            className={`chatbox-battle-action-btn chatbox-battle-auto-refresh-btn ${autoRefreshEnabled ? 'active' : ''}`}
                            onClick={toggleAutoRefresh}
                            title={autoRefreshEnabled ? '关闭自动刷新' : '开启自动刷新'}
                        >
                            {autoRefreshEnabled ? '🔄' : '⏸️'}
                        </button>
                        <button
                            className={`chatbox-battle-action-btn chatbox-battle-refresh-btn ${isRefreshing ? 'loading' : ''}`}
                            onClick={handleRefreshChat}
                            disabled={isRefreshing}
                            title="手动刷新聊天记录"
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
                            className="chatbox-battle-action-btn chatbox-battle-minimize-btn"
                            onClick={handleMinimize}
                            title={isMinimized ? '展开' : '最小化'}
                        >
                            {isMinimized ? '🔼' : '🔽'}
                        </button>
                        <button
                            className="chatbox-battle-action-btn chatbox-battle-close-btn"
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

                {/* 缩放手柄 - 仅在非最小化状态显示 */}
                {!isMinimized && (
                    <>
                        {/* 右边缘缩放手柄 */}
                        <div
                            className="chatbox-resize-handle chatbox-resize-handle-right"
                            onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
                        />
                        {/* 底边缩放手柄 */}
                        <div
                            className="chatbox-resize-handle chatbox-resize-handle-bottom"
                            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
                        />
                        {/* 右下角缩放手柄 */}
                        <div
                            className="chatbox-resize-handle chatbox-resize-handle-corner"
                            onMouseDown={(e) => handleResizeMouseDown(e, 'right bottom')}
                        />
                    </>
                )}
            </div>
        </>
    );
};
export default ChatBox;