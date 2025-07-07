import React from 'react';

interface MainActionsProps {
    onNavigateToBattle: () => void;
    onNavigateToCards: () => void;
    onNavigateToWish: () => void;
}

const MainActions: React.FC<MainActionsProps> = ({
    onNavigateToBattle,
    onNavigateToCards,
    onNavigateToWish
}) => {
    return (
        <section className="main-actions-section">
            <div className="main-actions">
                <button className="home-action-btn home-battle-btn" onClick={onNavigateToBattle}>
                    <div className="home-btn-background"></div>
                    <div className="btn-content">
                        <div className="btn-icon">⚔️</div>
                        <div className="btn-text">
                            <h3>开始对战</h3>
                            <p>与其他玩家展开激烈的卡牌对战</p>
                        </div>
                    </div>
                </button>

                <button className="home-action-btn cards-btn" onClick={onNavigateToCards}>
                    <div className="home-btn-background"></div>
                    <div className="btn-content">
                        <div className="btn-icon">🃏</div>
                        <div className="btn-text">
                            <h3>管理卡组</h3>
                            <p>编辑你的卡组，收集强力卡牌</p>
                        </div>
                    </div>
                </button>

                <button className="home-action-btn wish-btn" onClick={onNavigateToWish}>
                    <div className="home-btn-background"></div>
                    <div className="btn-content">
                        <div className="btn-icon">✨</div>
                        <div className="btn-text">
                            <h3>卡牌祈愿</h3>
                            <p>获取稀有卡牌，提升战斗实力</p>
                        </div>
                    </div>
                </button>
            </div>
        </section>
    );
};

export default MainActions;
