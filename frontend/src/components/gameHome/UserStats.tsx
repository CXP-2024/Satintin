import React from 'react';
import primogemIcon from '../../assets/images/primogem-icon.png';

interface UserStatsProps {
    user: any;
    cardCount: number;
}

const UserStats: React.FC<UserStatsProps> = ({ user, cardCount }) => {
    return (
        <section className="user-stats-section">
            <div className="stats-grid">
                <div className="stat-card rank">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-content">
                        <span className="stat-label">当前段位</span>
                        <span className="stat-value">{user?.rank}</span>
                    </div>
                </div>
                <div className="stat-card currency">
                    <div className="stat-icon">
                        <img src={primogemIcon} alt="原石" className="primogem-icon" />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">原石</span>
                        <span className="stat-value">{user?.stoneAmount}</span>
                    </div>
                </div>
                <div className="stat-card cards">
                    <div className="stat-icon">🃏</div>
                    <div className="stat-content">
                        <span className="stat-label">卡牌数量</span>
                        <span className="stat-value">{cardCount}</span>
                    </div>
                </div>
                <div className="stat-card wins">
                    <div className="stat-icon">⚔️</div>
                    <div className="stat-content">
                        <span className="stat-label">胜场</span>
                        <span className="stat-value">23</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default UserStats;
