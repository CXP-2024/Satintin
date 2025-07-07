import React from 'react';
import primogemIcon from '../../assets/images/primogem-icon.png';

interface GameHeaderProps {
    user: any;
    onNavigateToRules: () => void;
    onShowSearchUser: () => void;
    onShowUserProfile: () => void;
    onNavigateToShop: () => void;
    onLogout: () => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
    user,
    onNavigateToRules,
    onShowSearchUser,
    onShowUserProfile,
    onNavigateToShop,
    onLogout
}) => {
    return (
        <header className="game-header">
            <div className="header-left">
                <h1>Satintin</h1>
                <button className="rules-btn" onClick={onNavigateToRules}>
                    <span className="rules-icon">📖</span>
                    对战规则
                </button>
                <button className="search-user-btn" onClick={onShowSearchUser}>
                    <span className="search-icon">🔍</span>
                    搜索用户
                </button>
            </div>
            <div className="header-right">
                <div className="user-info clickable" onClick={onShowUserProfile}>
                    <span className="username">{user?.userName}</span>
                    <span className="coins">
                        <img src={primogemIcon} alt="原石" className="primogem-icon small" />
                        {user?.stoneAmount}
                    </span>
                </div>
                <button className="charge-btn" onClick={onNavigateToShop}>
                    充值
                </button>
                <button className="home-logout-btn" onClick={onLogout}>
                    退出登录
                </button>
            </div>
        </header>
    );
};

export default GameHeader;
