import React, { useState } from 'react';
import './SearchUserModal.css';
import UserReportModal from './UserReportModal';
import { SoundUtils } from 'utils/soundUtils';
import { useUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";

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
    const currentUser = useUserInfo();
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [reportError, setReportError] = useState('');

    if (!isOpen) return null;

    const handleReportClick = () => {
        SoundUtils.playClickSound(0.5);
        setShowReportModal(true);
    };

    const handleReportClose = () => {
        setShowReportModal(false);
    };
    
    const handleReportSubmit = (userId: string, reason: string, description: string) => {
        setReportSuccess(true);
        setTimeout(() => {
            setReportSuccess(false);
        }, 3000);
    };

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
                                            <span className="search-stat-value">{searchedUser.rank || 'Bronze'}</span>
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
                                    
                                    {/* 举报按钮 */}
                                    {searchedUser.userID !== currentUser?.userID && (
                                        <div className="report-user-section">
                                            <button 
                                                className="report-user-btn" 
                                                onClick={handleReportClick}
                                            >
                                                举报用户
                                            </button>
                                            
                                            {reportSuccess && (
                                                <div className="report-success-message">
                                                    举报已提交，我们会尽快处理
                                                </div>
                                            )}
                                            
                                            {reportError && (
                                                <div className="report-error-message">
                                                    {reportError}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* 举报模态框 */}
            {searchedUser && (
                <UserReportModal
                    isOpen={showReportModal}
                    username={searchedUser.userName}
                    userID={searchedUser.userID}
                    onClose={handleReportClose}
                    onSubmit={handleReportSubmit}
                />
            )}
        </div>
    );
};

export default SearchUserModal;
