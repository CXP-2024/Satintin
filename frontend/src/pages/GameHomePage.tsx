import React from 'react';
import { useAuthStore } from '../store/authStore';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './GameHomePage.css';
import primogemIcon from '../assets/images/primogem-icon.png';

const GameHomePage: React.FC = () => {
	const { user, logout } = useAuthStore();
	const { navigateWithTransition } = usePageTransition();

	console.log('🎮 [GameHomePage] 游戏主页组件已挂载');
	console.log('👤 [GameHomePage] 当前用户信息:', user);

	const handleLogout = () => {
		console.log('🚪 [GameHomePage] 用户点击退出登录');
		logout();
	};

	const handleNavigateToBattle = () => {
		console.log('⚔️ [GameHomePage] 导航到战斗页面');
		navigateWithTransition('/battle', '正在进入战斗...');
	};

	const handleNavigateToCards = () => {
		console.log('🃏 [GameHomePage] 导航到卡组页面');
		navigateWithTransition('/cards', '正在加载卡组...');
	};

	const handleNavigateToWish = () => {
		console.log('🛒 [GameHomePage] 导航到祈愿页面');
		navigateWithTransition('/wish', '正在准备祈愿...');
	};

	return (
		<PageTransition className="game-page">
			<div className="game-home">
				{/* 顶部状态栏 */}
				<header className="game-header">
					<div className="header-left">
						<h1>阵面对战</h1>
					</div>
					<div className="header-right">
						<div className="user-info">
							<span className="username">{user?.username}</span>
							<span className="coins">
								<img src={primogemIcon} alt="原石" className="primogem-icon small" />
								{user?.gems}
							</span>
						</div>
						<button className="logout-btn" onClick={handleLogout}>
							退出登录
						</button>
					</div>
				</header>

				{/* 主内容区域 */}
				<main className="home-main">
					{/* 欢迎区域 */}
					<section className="welcome-section">
						<div className="welcome-content">
							<h2 className="welcome-title">欢迎回来，{user?.username}！</h2>
							<p className="welcome-subtitle">准备好迎接激烈的卡牌对战了吗？</p>
						</div>
					</section>

					{/* 用户状态卡片 */}
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
									<span className="stat-value">{user?.gems}</span>
								</div>
							</div>
							<div className="stat-card cards">
								<div className="stat-icon">🃏</div>
								<div className="stat-content">
									<span className="stat-label">卡牌数量</span>
									<span className="stat-value">45</span>
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

					{/* 主要功能按钮 */}
					<section className="main-actions-section">
						<div className="main-actions">
							<button className="action-btn battle-btn" onClick={handleNavigateToBattle}>
								<div className="btn-background"></div>
								<div className="btn-content">
									<div className="btn-icon">⚔️</div>
									<div className="btn-text">
										<h3>开始对战</h3>
										<p>与其他玩家展开激烈的卡牌对战</p>
									</div>
								</div>
							</button>

							<button className="action-btn cards-btn" onClick={handleNavigateToCards}>
								<div className="btn-background"></div>
								<div className="btn-content">
									<div className="btn-icon">🃏</div>
									<div className="btn-text">
										<h3>管理卡组</h3>
										<p>编辑你的卡组，收集强力卡牌</p>
									</div>
								</div>
							</button>

							<button className="action-btn wish-btn" onClick={handleNavigateToWish}>
								<div className="btn-background"></div>
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

					{/* 快速信息 */}
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
								<button className="claim-btn">领取</button>
							</div>
							<div className="info-card">
								<h4>📈 排行榜</h4>
								<p>当前排名: #127</p>
								<span className="rank-change up">↗ +5</span>
							</div>
						</div>
					</section>
				</main>
			</div>
		</PageTransition>
	);
};

export default GameHomePage;
