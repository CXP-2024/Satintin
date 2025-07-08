import React from 'react';
import { FriendInfo } from './UserProfileUtils';
import { UserProfileHandleState, handleAddFriend, handleRemoveFriend, handleBlockUser, getStatusInfo, getRankColor } from './UserProfileHandles';

interface FriendsListProps {
    friendsData: FriendInfo[];
    loading: boolean;
    addFriendID: string;
    setAddFriendID: (id: string) => void;
    friendsLoadingStatus: string;
    handleState: UserProfileHandleState;
}

const FriendsList: React.FC<FriendsListProps> = ({
    friendsData,
    loading,
    addFriendID,
    setAddFriendID,
    friendsLoadingStatus,
    handleState
}) => {
    return (
        <div className="content-panel friends-panel">
            <div className="friends-list">
                <div className="list-header">
                    <h3>好友列表 ({friendsData.length})</h3>
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
                                            className="friend-action-btn chat"
                                            disabled={loading}
                                            title="私聊功能暂未开放"
                                        >
                                            💬
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
