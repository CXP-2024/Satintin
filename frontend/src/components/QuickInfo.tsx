import React from 'react';

interface QuickInfoProps {
    onClaimReward: () => void;
}

const QuickInfo: React.FC<QuickInfoProps> = ({ onClaimReward }) => {
    return (
        <section className="quick-info-section">
            <div className="info-cards">
                <div className="info-card">
                    <h4>🎯 今日任务</h4>
                    <p>完成3场对战 (2/3)</p>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '66%' }}></div>
                    </div>
                </div>
                <div className="info-card">
                    <h4>🎁 每日奖励</h4>
                    <p>登录第3天，获得200原石</p>
                    <button className="claim-btn" onClick={onClaimReward}>领取</button>
                </div>
                <div className="info-card">
                    <h4>📈 排行榜</h4>
                    <p>当前排名: #127</p>
                    <span className="rank-change up">↗ +5</span>
                </div>
            </div>
        </section>
    );
};

export default QuickInfo;
