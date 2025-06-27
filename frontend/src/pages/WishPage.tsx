import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './WishPage.css';
import primogemIcon from '../assets/images/primogem-icon.png';

const WishPage: React.FC = () => {
	const { user } = useAuthStore();
	const { navigateQuick } = usePageTransition();
	const [selectedBanner, setSelectedBanner] = useState<'standard' | 'featured' | 'weapon'>('featured');
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [wishHistory, setWishHistory] = useState<any[]>([]);

	const handleBackToHome = () => {
		navigateQuick('/game');
	};

	const handleSingleWish = () => {
		// 模拟单次祈愿
		console.log('单次祈愿');
	};

	const handleTenWish = () => {
		// 模拟十连祈愿
		console.log('十连祈愿');
	};

	const banners = {
		featured: {
			name: '限定角色祈愿',
			subtitle: '「神秘法师」概率UP',
			image: '🧙‍♂️',
			description: '限定时间内，5星角色「神秘法师」获得概率大幅提升！',
			guaranteed: '90次内必出5星',
			singleCost: 160,
			tenCost: 1600,
			endTime: '2024-12-31 23:59',
		},
		standard: {
			name: '常驻祈愿',
			subtitle: '永久开放',
			image: '⭐',
			description: '常驻祈愿池，包含所有基础角色和武器',
			guaranteed: '90次内必出5星',
			singleCost: 160,
			tenCost: 1600,
			endTime: '永久开放',
		},
		weapon: {
			name: '武器祈愿',
			subtitle: '「毁灭之刃」概率UP',
			image: '⚔️',
			description: '限定时间内，5星武器「毁灭之刃」获得概率大幅提升！',
			guaranteed: '80次内必出5星',
			singleCost: 160,
			tenCost: 1600,
			endTime: '2024-12-25 23:59',
		},
	};

	const currentBanner = banners[selectedBanner];

	const renderBannerSelector = () => (
		<div className="banner-selector">
			<h3>选择祈愿池</h3>
			<div className="banner-tabs">
				<button
					className={`banner-tab ${selectedBanner === 'featured' ? 'active' : ''}`}
					onClick={() => setSelectedBanner('featured')}
				>
					<div className="tab-icon">🌟</div>
					<div className="tab-text">
						<div className="tab-title">限定祈愿</div>
						<div className="tab-subtitle">角色UP</div>
					</div>
				</button>
				<button
					className={`banner-tab ${selectedBanner === 'standard' ? 'active' : ''}`}
					onClick={() => setSelectedBanner('standard')}
				>
					<div className="tab-icon">⭐</div>
					<div className="tab-text">
						<div className="tab-title">常驻祈愿</div>
						<div className="tab-subtitle">永久开放</div>
					</div>
				</button>
				<button
					className={`banner-tab ${selectedBanner === 'weapon' ? 'active' : ''}`}
					onClick={() => setSelectedBanner('weapon')}
				>
					<div className="tab-icon">⚔️</div>
					<div className="tab-text">
						<div className="tab-title">武器祈愿</div>
						<div className="tab-subtitle">武器UP</div>
					</div>
				</button>
			</div>
		</div>
	);

	const renderBannerInfo = () => (
		<div className="banner-info">
			<div className="banner-display">
				<div className="banner-image">
					<div className="featured-character">{currentBanner.image}</div>
					<div className="banner-effects">
						<div className="effect-particle"></div>
						<div className="effect-particle"></div>
						<div className="effect-particle"></div>
					</div>
				</div>
				<div className="banner-details">
					<h2 className="banner-name">{currentBanner.name}</h2>
					<p className="banner-subtitle">{currentBanner.subtitle}</p>
					<p className="banner-description">{currentBanner.description}</p>
					<div className="banner-stats">
						<div className="stat-item">
							<span className="stat-label">保底机制</span>
							<span className="stat-value">{currentBanner.guaranteed}</span>
						</div>
						<div className="stat-item">
							<span className="stat-label">活动时间</span>
							<span className="stat-value">{currentBanner.endTime}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	const renderWishActions = () => (
		<div className="wish-actions">
			<div className="user-currency">
				<img src={primogemIcon} alt="原石" className="currency-icon" />
				<span className="currency-amount">{user?.gems}</span>
			</div>

			<div className="wish-buttons">
				<div className="wish-option">
					<button className="wish-btn single" onClick={handleSingleWish}>
						<div className="btn-content">
							<div className="btn-icon">✨</div>
							<div className="btn-text">
								<div className="btn-title">单次祈愿</div>
								<div className="btn-cost">
									<img src={primogemIcon} alt="原石" className="cost-icon" />
									{currentBanner.singleCost}
								</div>
							</div>
						</div>
					</button>
				</div>

				<div className="wish-option">
					<button className="wish-btn ten" onClick={handleTenWish}>
						<div className="btn-content">
							<div className="btn-icon">💫</div>
							<div className="btn-text">
								<div className="btn-title">十连祈愿</div>
								<div className="btn-cost">
									<img src={primogemIcon} alt="原石" className="cost-icon" />
									{currentBanner.tenCost}
								</div>
							</div>
						</div>
					</button>
				</div>
			</div>

			<div className="wish-info">
				<div className="pity-counter">
					<span className="pity-label">距离保底还需:</span>
					<span className="pity-count">73次</span>
				</div>
				<button className="history-btn">
					📜 祈愿记录
				</button>
			</div>
		</div>
	);

	const renderRateInfo = () => (
		<div className="rate-info">
			<h3>获得概率</h3>
			<div className="rate-table">
				<div className="rate-row">
					<span className="rarity legendary">5星</span>
					<span className="rate">0.6%</span>
					<span className="description">传说级角色/武器</span>
				</div>
				<div className="rate-row">
					<span className="rarity epic">4星</span>
					<span className="rate">5.1%</span>
					<span className="description">稀有角色/武器</span>
				</div>
				<div className="rate-row">
					<span className="rarity rare">3星</span>
					<span className="rate">94.3%</span>
					<span className="description">普通武器</span>
				</div>
			</div>
		</div>
	);

	return (
		<PageTransition className="wish-page">
			<div className="wish-page">
				<header className="page-header">
					<button className="back-btn" onClick={handleBackToHome}>
						← 返回主页
					</button>
					<h1>卡牌祈愿</h1>
					<div className="user-currency-header">
						<img src={primogemIcon} alt="原石" className="currency-icon" />
						<span className="currency-amount">{user?.gems}</span>
					</div>
				</header>

				<main className="wish-main">
					{renderBannerSelector()}
					{renderBannerInfo()}
					{renderWishActions()}
					{renderRateInfo()}
				</main>
			</div>
		</PageTransition>
	);
};

export default WishPage;
