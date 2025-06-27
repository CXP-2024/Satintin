import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './WishPage.css';
import primogemIcon from '../assets/images/primogem-icon.png';
import gaiyaImage from '../assets/images/gaiya.png';
import jiegeImage from '../assets/images/jiege.jpg';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from '../utils/soundUtils';

const WishPage: React.FC = () => {
	const { user } = useAuthStore();
	const { navigateQuick } = usePageTransition();
	const [selectedBanner, setSelectedBanner] = useState<'standard' | 'featured'>('featured');

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	const handleBackToHome = () => {
		playClickSound();
		navigateQuick('/game');
	};

	const handleSingleWish = () => {
		// 播放点击音效
		playClickSound();

		// 检查用户是否有足够的原石
		if (!user || user.coins < currentBanner.singleCost) {
			alert('原石不足！');
			return;
		}

		// 跳转到抽卡结果页面
		navigateQuick(`/wish-result?type=single&banner=${selectedBanner}`);
	};

	const handleTenWish = () => {
		// 播放点击音效
		playClickSound();

		// 检查用户是否有足够的原石
		if (!user || user.coins < currentBanner.tenCost) {
			alert('原石不足！');
			return;
		}

		// 跳转到抽卡结果页面
		navigateQuick(`/wish-result?type=ten&banner=${selectedBanner}`);
	};

	const banners = {
		featured: {
			name: '限定卡牌祈愿',
			subtitle: '「盖亚——！！」概率UP',
			image: gaiyaImage,
			description: '限定时间内，5星卡牌「盖亚——！！」获得概率大幅提升！',
			guaranteed: '90次内必出5星',
			singleCost: 160,
			tenCost: 1600,
			endTime: '2024-12-31 23:59',
		},
		standard: {
			name: '常驻卡牌祈愿',
			subtitle: '杰哥 概率UP',
			image: jiegeImage,
			description: '常驻祈愿池，包含所有基础卡牌',
			guaranteed: '90次内必出5星',
			singleCost: 160,
			tenCost: 1600,
			endTime: '永久开放',
		},
	};

	const currentBanner = banners[selectedBanner];

	const renderBannerSelector = () => (
		<div className="banner-selector">
			<h3>选择祈愿池</h3>
			<div className="banner-tabs">
				<button
					className={`banner-tab ${selectedBanner === 'featured' ? 'active' : ''}`}
					onClick={() => {
						playClickSound();
						setSelectedBanner('featured');
					}}
				>
					<div className="tab-icon">🌟</div>
					<div className="tab-text">
						<div className="tab-title">限定祈愿</div>
						<div className="tab-subtitle">卡牌UP</div>
					</div>
				</button>
				<button
					className={`banner-tab ${selectedBanner === 'standard' ? 'active' : ''}`}
					onClick={() => {
						playClickSound();
						setSelectedBanner('standard');
					}}
				>
					<div className="tab-icon">⭐</div>
					<div className="tab-text">
						<div className="tab-title">常驻祈愿</div>
						<div className="tab-subtitle">永久开放</div>
					</div>
				</button>
			</div>
		</div>
	);

	// 左侧角色展示
	const renderCharacterShowcase = () => (
		<div className="character-showcase">
			<div className="featured-character-large">
				{typeof currentBanner.image === 'string' && (currentBanner.image.startsWith('/') || currentBanner.image.includes('.')) ? (
					<img src={currentBanner.image} alt={currentBanner.subtitle} />
				) : (
					<div style={{ fontSize: '300px', textAlign: 'center' }}>{currentBanner.image}</div>
				)}
			</div>
			<h2 className="character-name">{currentBanner.subtitle}</h2>
			<p className="character-subtitle">{selectedBanner === 'featured' ? '限定UP' : '常驻角色'}</p>
		</div>
	);

	// 右侧信息面板
	const renderInfoPanel = () => (
		<div className="wish-info-panel">
			{/* Banner详细信息 */}
			<div className="banner-details-card">
				<h3 className="banner-title">{currentBanner.name}</h3>
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

			{/* 祈愿操作区域 */}
			<div className="wish-actions-card">

				<div className="wish-buttons">
					<div className="wish-option">
						<button className="wish-btn single" onClick={handleSingleWish}>
							<div className="btn-content">
								<div className="btn-icon">✨</div>
								<div className="btn-title">单次祈愿</div>
								<div className="btn-cost">
									<img src={primogemIcon} alt="原石" className="cost-icon" />
									{currentBanner.singleCost}
								</div>
							</div>
						</button>
					</div>

					<div className="wish-option">
						<button className="wish-btn ten" onClick={handleTenWish}>
							<div className="btn-content">
								<div className="btn-icon">💫</div>
								<div className="btn-title">十连祈愿</div>
								<div className="btn-cost">
									<img src={primogemIcon} alt="原石" className="cost-icon" />
									{currentBanner.tenCost}
								</div>
							</div>
						</button>
					</div>
				</div>

				<div className="pity-info">
					<div className="pity-label">距离保底还需:</div>
					<div className="pity-count">73次</div>
				</div>
			</div>
		</div>
	);

	return (
		<PageTransition className="card-page">
			<div className="wish-page">
				<header className="page-header">
					<button className="back-btn" onClick={handleBackToHome}>
						← 返回主页
					</button>
					<h1>卡牌祈愿</h1>
					<div className="user-currency-header">
						<img src={primogemIcon} alt="原石" className="currency-icon" />
						<span className="currency-amount">{user?.coins}</span>
					</div>
				</header>

				<main className="wish-main">
					{renderBannerSelector()}
					<div className="wish-content">
						{renderCharacterShowcase()}
						{renderInfoPanel()}
					</div>
				</main>
			</div>
		</PageTransition>
	);
};

export default WishPage;
