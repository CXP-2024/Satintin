import React from 'react';
import { BlockedUserInfo } from './UserProfileUtils';
import { UserProfileHandleState, handleUnblockUser, getRankColor } from './UserProfileHandles';

interface BlockedListProps {
    blockedData: BlockedUserInfo[];
    loading: boolean;
    handleState: UserProfileHandleState;
}

const BlockedList: React.FC<BlockedListProps> = ({
    blockedData,
    loading,
    handleState
}) => {
    return (
        <div className="content-panel blocked-panel">
            <div className="blocked-list">
                <div className="list-header">
                    <h3>黑名单 ({blockedData.length})</h3>
                </div>
                <div className="list-container">
                    {blockedData.length > 0 ? (
                        blockedData.map((blocked) => (
                            <div key={blocked.id} className="blocked-item">
                                <div className="blocked-avatar">
                                    {blocked.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="blocked-info">
                                    <div className="blocked-name">{blocked.username}</div>
                                    <div className="blocked-rank" style={{ color: getRankColor(blocked.rank) }}>
                                        {blocked.rank}
                                    </div>
                                </div>
                                <div className="blocked-date">
                                    <div className="date-label">拉黑时间</div>
                                    <div className="date-value">{blocked.blockedDate}</div>
                                </div>
                                <div className="blocked-actions">
                                    <button 
                                        className="friend-action-btn unblock"
                                        onClick={() => handleUnblockUser(blocked.id)}
                                        disabled={loading}
                                    >
                                        解除拉黑
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : loading ? (
                        <div className="empty-state">
                            <div className="empty-icon">⏳</div>
                            <div className="empty-text">
                                <h4>加载中...</h4>
                                <p>正在获取黑名单</p>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">🚫</div>
                            <div className="empty-text">
                                <h4>黑名单为空</h4>
                                <p>你还没有拉黑任何用户</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlockedList;
