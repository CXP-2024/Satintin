import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import './GameHomePage.css';

const GameHomePage: React.FC = () => {
	const { user, logout } = useAuthStore();
	const [activeTab, setActiveTab] = useState<'home' | 'battle' | 'cards' | 'shop'>('home');

	console.log('🎮 [GameHomePage] 游戏主页组件已挂载');
	console.log('👤 [GameHomePage] 当前用户信息:', user);
	console.log('📋 [GameHomePage] 当前活跃标签:', activeTab);

	const handleLogout = () => {
		console.log('🚪 [GameHomePage] 用户点击退出登录');
		logout();
	};

	const handleTabChange = (tab: 'home' | 'battle' | 'cards' | 'shop') => {
		console.log(`📋 [GameHomePage] 切换标签: ${activeTab} → ${tab}`);
		setActiveTab(tab);
	};

	const renderContent = () => {
		switch (activeTab) {
			case 'home':
				return (
					<div className="home-content">
						<div className="welcome-section">
							<h2>欢迎回来，{user?.username}！</h2>
							<div className="user-stats">
								<div className="stat-card">
									<div className="stat-icon">🏆</div>
									<div className="stat-info">
										<span className="stat-label">段位</span>
										<span className="stat-value">{user?.rank}</span>
									</div>
								</div>
								<div className="stat-card">
									<div className="stat-icon">💎</div>
									<div className="stat-info">
										<span className="stat-label">原石</span>
										<span className="stat-value">{user?.coins}</span>
									</div>
								</div>
								<div className="stat-card">
									<div className="stat-icon">🃏</div>
									<div className="stat-info">
										<span className="stat-label">卡牌</span>
										<span className="stat-value">12</span>
									</div>
								</div>
							</div>
						</div>

						<div className="quick-actions">
							<h3>快速开始</h3>
							<div className="action-buttons">
								<button
									className="action-btn primary"
									onClick={() => handleTabChange('battle')}
								>
									<span className="btn-icon">⚔️</span>
									开始对战
								</button>
								<button
									className="action-btn secondary"
									onClick={() => handleTabChange('cards')}
								>
									<span className="btn-icon">🃏</span>
									管理卡组
								</button>
								<button
									className="action-btn tertiary"
									onClick={() => handleTabChange('shop')}
								>
									<span className="btn-icon">🛒</span>
									卡牌商店
								</button>
							</div>
						</div>
					</div>
				);

			case 'battle':
				return (
					<div className="battle-content">
						<h2>对战大厅</h2>
						<div className="battle-modes">
							<div className="mode-card">
								<h3>快速对战</h3>
								<p>与随机玩家进行对战，测试你的策略</p>
								<button className="mode-btn">开始匹配</button>
							</div>
							<div className="mode-card">
								<h3>排位赛</h3>
								<p>排位对战，提升你的段位</p>
								<button className="mode-btn">排位匹配</button>
							</div>
							<div className="mode-card">
								<h3>好友对战</h3>
								<p>与好友进行友谊赛</p>
								<button className="mode-btn">创建房间</button>
							</div>
						</div>
					</div>
				);

			case 'cards':
				return (
					<div className="cards-content">
						<h2>我的卡组</h2>
						<div className="deck-section">
							<h3>当前卡组</h3>
							<div className="deck-cards">
								<div className="card-slot">
									<div className="card common">穿透卡（普通）</div>
								</div>
								<div className="card-slot">
									<div className="card rare">发育卡（稀有）</div>
								</div>
								<div className="card-slot">
									<div className="card common">反弹卡（普通）</div>
								</div>
							</div>
						</div>

						<div className="collection-section">
							<h3>卡牌收藏</h3>
							<div className="card-collection">
								<div className="collection-card common">穿透卡 x3</div>
								<div className="collection-card rare">发育卡 x2</div>
								<div className="collection-card legendary">反弹卡（传说）x1</div>
								<div className="collection-card common">穿透卡（普通）x5</div>
							</div>
						</div>
					</div>
				);

			case 'shop':
				return (
					<div className="shop-content">
						<h2>卡牌商店</h2>
						<div className="shop-section">
							<div className="pack-card">
								<h3>标准卡包</h3>
								<p>包含各种稀有度的卡牌</p>
								<div className="pack-price">100 原石</div>
								<button className="pack-btn">购买卡包</button>
							</div>
							<div className="pack-card">
								<h3>高级卡包</h3>
								<p>更高概率获得稀有卡牌</p>
								<div className="pack-price">300 原石</div>
								<button className="pack-btn">购买卡包</button>
							</div>
							<div className="pack-card">
								<h3>传说卡包</h3>
								<p>保底一张传说卡牌</p>
								<div className="pack-price">1000 原石</div>
								<button className="pack-btn">购买卡包</button>
							</div>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className="game-home">
			<header className="game-header">
				<div className="header-left">
					<h1>阵面对战</h1>
				</div>
				<div className="header-right">
					<div className="user-info">
						<span className="username">{user?.username}</span>
						<span className="coins">💎 {user?.coins}</span>
					</div>
					<button className="logout-btn" onClick={handleLogout}>
						退出登录
					</button>
				</div>
			</header>

			<div className="game-container">
				<nav className="game-nav">
					<button
						className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
						onClick={() => handleTabChange('home')}
					>
						🏠 主页
					</button>
					<button
						className={`nav-btn ${activeTab === 'battle' ? 'active' : ''}`}
						onClick={() => handleTabChange('battle')}
					>
						⚔️ 对战
					</button>
					<button
						className={`nav-btn ${activeTab === 'cards' ? 'active' : ''}`}
						onClick={() => handleTabChange('cards')}
					>
						🃏 卡组
					</button>
					<button
						className={`nav-btn ${activeTab === 'shop' ? 'active' : ''}`}
						onClick={() => handleTabChange('shop')}
					>
						🛒 商店
					</button>
				</nav>

				<main className="game-main">
					{renderContent()}
				</main>
			</div>
		</div>
	);
};

export default GameHomePage;
