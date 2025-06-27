import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './BattlePage.css';

const BattlePage: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useAuthStore();

	const handleBackToHome = () => {
		navigate('/game');
	};

	return (
		<div className="battle-page">
			<header className="page-header">
				<button className="back-btn" onClick={handleBackToHome}>
					← 返回主页
				</button>
				<h1>对战大厅</h1>
				<div className="user-rank">
					<span className="rank-label">当前段位</span>
					<span className="rank-value">{user?.rank}</span>
				</div>
			</header>

			<main className="battle-main">
				<div className="battle-modes-container">
					<div className="mode-card primary-mode">
						<div className="mode-icon">⚔️</div>
						<h3>快速对战</h3>
						<p>与随机玩家进行对战，测试你的策略技巧</p>
						<div className="mode-rewards">
							<span>胜利奖励: +20 原石</span>
						</div>
						<button className="mode-btn primary">开始匹配</button>
					</div>

					<div className="mode-card ranked-mode">
						<div className="mode-icon">🏆</div>
						<h3>排位赛</h3>
						<p>排位对战，提升你的段位获得更多奖励</p>
						<div className="mode-rewards">
							<span>胜利奖励: +50 原石 + 段位积分</span>
						</div>
						<button className="mode-btn ranked">排位匹配</button>
					</div>

					<div className="mode-card friend-mode">
						<div className="mode-icon">👥</div>
						<h3>好友对战</h3>
						<p>与好友进行友谊赛，切磋技艺</p>
						<div className="mode-rewards">
							<span>无奖励，纯粹的友谊切磋</span>
						</div>
						<button className="mode-btn friend">创建房间</button>
					</div>
				</div>

				<div className="battle-stats">
					<h3>战斗统计</h3>
					<div className="stats-grid">
						<div className="stat-item">
							<div className="stat-number">23</div>
							<div className="stat-label">总胜场</div>
						</div>
						<div className="stat-item">
							<div className="stat-number">15</div>
							<div className="stat-label">总败场</div>
						</div>
						<div className="stat-item">
							<div className="stat-number">60.5%</div>
							<div className="stat-label">胜率</div>
						</div>
						<div className="stat-item">
							<div className="stat-number">7</div>
							<div className="stat-label">连胜</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
};

export default BattlePage;
