import React from 'react';

interface SearchUserModalProps {
    isOpen: boolean;
    searchUsername: string;
    setSearchUsername: (username: string) => void;
    searchedUser: any;
    searchLoading: boolean;
    searchError: string;
    onSearch: () => void;
    onClose: () => void;
}

const SearchUserModal: React.FC<SearchUserModalProps> = ({
    isOpen,
    searchUsername,
    setSearchUsername,
    searchedUser,
    searchLoading,
    searchError,
    onSearch,
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="search-user-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>搜索用户</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-content">
                    <div className="search-input-group">
                        <input
                            type="text"
                            placeholder="请输入用户名"
                            value={searchUsername}
                            onChange={(e) => setSearchUsername(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
                        />
                        <button 
                            className="search-btn" 
                            onClick={onSearch}
                            disabled={searchLoading}
                        >
                            {searchLoading ? '搜索中...' : '搜索'}
                        </button>
                    </div>
                    
                    {searchError && (
                        <div className="error-message">
                            {searchError}
                        </div>
                    )}
                    
                    {searchedUser && (
                        <div className="user-search-result">
                            <div className="user-card">
                                <div className="user-avatar">
                                    <span className="avatar-icon">👤</span>
                                </div>
                                <div className="user-details">
                                    <h4>{searchedUser.userName}</h4>
                                    <div className="user-stats">
                                        <div className="search-stat-item">
                                            <span className="search-stat-label">段位:</span>
                                            <span className="search-stat-value">{searchedUser.rank || 'N/A'}</span>
                                        </div>
                                        <div className="search-stat-item">
                                            <span className="search-stat-label">原石:</span>
                                            <span className="search-stat-value">{searchedUser.stoneAmount || 0}</span>
                                        </div>
                                        <div className="search-stat-item">
                                            <span className="search-stat-label">邮箱:</span>
                                            <span className="search-stat-value">{searchedUser.email || 'N/A'}</span>
                                        </div>
                                        <div className="search-stat-item">
                                            <span className="search-stat-label">在线状态:</span>
                                            <span className={`search-stat-value ${searchedUser.isOnline ? 'online' : 'offline'}`}>
                                                {searchedUser.isOnline ? '在线' : '离线'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchUserModal;
