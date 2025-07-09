import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FriendInfo } from './UserProfile/UserProfileUtils';
import { UserProfileHandleState, handleAddFriend, handleRemoveFriend, handleBlockUser, getStatusInfo, getRankColor } from './UserProfile/UserProfileHandles';

interface FriendsListProps {
    friendsData: FriendInfo[];
    loading: boolean;
    addFriendID: string;
    setAddFriendID: (id: string) => void;
    friendsLoadingStatus: string;
    handleState: UserProfileHandleState;
    onRefreshFriends?: () => void; // Function to refresh friends from database
    isRefreshing?: boolean; // Loading state for refresh
    onOpenChatBox?: (friend: FriendInfo) => void; // Function to open ChatBox
    autoRefreshEnabled?: boolean; // Auto refresh enabled state
    setAutoRefreshEnabled?: (enabled: boolean) => void; // Function to toggle auto refresh
}

const FriendsList: React.FC<FriendsListProps> = ({
    friendsData,
    loading,
    addFriendID,
    setAddFriendID,
    friendsLoadingStatus,
    handleState,
    onRefreshFriends,
    isRefreshing = false,
    onOpenChatBox,
    autoRefreshEnabled = true,
    setAutoRefreshEnabled
}) => {
    const navigate = useNavigate();

    const openChat = (friend: FriendInfo) => {
        navigate('/chat', {
            state: {
                friendId: friend.id,
                friendName: friend.username
            }
        });
    };

    const openChatBox = (friend: FriendInfo) => {
        if (onOpenChatBox) {
            onOpenChatBox(friend);
        }
    };

    return (
        <div className="content-panel friends-panel">
            <div className="friends-list">
                <div className="list-header">
                    <div className="list-header-top">
                        <h3>好友列表 ({friendsData.length})</h3>
                        <div className="list-header-buttons">
                            {onRefreshFriends && (
                                <>
                                    <button 
                                        className={`friends-refresh-btn ${isRefreshing ? 'loading' : ''}`}
                                        onClick={onRefreshFriends}
                                        disabled={isRefreshing || loading}
                                        title="手动刷新好友列表"
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
                                        <span className="refresh-text">
                                            {isRefreshing ? '刷新中...' : '手动'}
                                        </span>
                                    </button>
                                    
                                    {setAutoRefreshEnabled && (
                                        <button 
                                            className={`auto-refresh-toggle-btn ${autoRefreshEnabled ? 'enabled' : 'disabled'}`}
                                            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                                            title={autoRefreshEnabled ? '关闭自动刷新' : '开启自动刷新'}
                                        >
                                            <span className="toggle-icon">
                                                {autoRefreshEnabled ? '⏸️' : '▶️'}
                                            </span>
                                            <span className="toggle-text">
                                                {autoRefreshEnabled ? '自动中' : '已暂停'}
                                            </span>
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    {friendsLoadingStatus && (
                        <div className="loading-status" style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                            {friendsLoadingStatus}
                        </div>
                    )}
                    <div className="add-friend-section">
                        <input
                            type="text"
                            placeholder="输入用户ID添加好友"
                            value={addFriendID}
                            onChange={(e) => setAddFriendID(e.target.value)}
                            disabled={loading}
                        />
                        <button 
                            className="add-friend-btn"
                            onClick={() => handleAddFriend(handleState)}
                            disabled={loading || !addFriendID.trim()}
                        >
                            {loading ? '添加中...' : '+ 添加好友'}
                        </button>
                    </div>
                </div>
                <div className="list-container">
                    {friendsData.length > 0 ? (
                        friendsData.map((friend) => {
                            const statusInfo = getStatusInfo(friend.status);
                            return (
                                <div key={friend.id} className="friend-item">
                                    <div className="friend-avatar">
                                        {friend.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="friend-info">
                                        <div className="friend-name">{friend.username}</div>
                                        <div className="friend-rank" style={{ color: getRankColor(friend.rank) }}>
                                            {friend.rank}
                                        </div>
                                    </div>
                                    <div className="friend-status">
                                        <div className="status-indicator" style={{ color: statusInfo.color }}>
                                            {statusInfo.icon} {statusInfo.text}
                                        </div>
                                        <div className="last-seen">{friend.lastSeen}</div>
                                    </div>
                                    <div className="friend-actions">
                                        <button 
                                            className="friend-action-btn chat green"
                                            onClick={() => openChat(friend)}
                                            disabled={loading}
                                            title="私聊"
                                        >
                                            💬
                                        </button>
                                        <button 
                                            className="friend-action-btn chatbox blue"
                                            onClick={() => openChatBox(friend)}
                                            disabled={loading}
                                            title="聊天框"
                                        >
                                            💭
                                        </button>
                                        <button 
                                            className="friend-action-btn invite"
                                            disabled={loading}
                                            title="邀请对战功能暂未开放"
                                        >
                                            ⚔️
                                        </button>
                                        <button 
                                            className="friend-action-btn remove"
                                            onClick={() => handleRemoveFriend(friend.id, handleState)}
                                            disabled={loading}
                                            title="移除好友"
                                        >
                                            🗑️
                                        </button>
                                        <button 
                                            className="friend-action-btn block"
                                            onClick={() => handleBlockUser(friend.id, handleState)}
                                            disabled={loading}
                                            title="拉黑用户"
                                        >
                                            🚫
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : loading ? (
                        <div className="empty-state">
                            <div className="empty-icon">⏳</div>
                            <div className="empty-text">
                                <h4>加载中...</h4>
                                <p>正在获取好友列表</p>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">👥</div>
                            <div className="empty-text">
                                <h4>还没有好友</h4>
                                <p>快去添加一些好友一起游戏吧！</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendsList;
