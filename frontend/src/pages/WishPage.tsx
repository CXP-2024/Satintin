import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './WishPage.css';
import primogemIcon from '../assets/images/primogem-icon.png';
import nailongImage from '../assets/images/nailong.webp';
import jiegeImage from '../assets/images/jiege.png';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from '../utils/soundUtils';

const WishPage: React.FC = () => {
	const { user } = useAuthStore();
	const { navigateQuick } = usePageTransition();
	const [selectedBanner, setSelectedBanner] = useState<'standard' | 'featured'>('featured');
	const [showHistory, setShowHistory] = useState(false);
	const [showRules, setShowRules] = useState(false);
	const [isHistoryClosing, setIsHistoryClosing] = useState(false);
	const [isRulesClosing, setIsRulesClosing] = useState(false);

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	const handleShowHistory = () => {
		playClickSound();
		setShowHistory(true);
		setIsHistoryClosing(false);
	};

	const handleCloseHistory = () => {
		playClickSound();
		setIsHistoryClosing(true);
		// 等待动画完成后再隐藏模态框
		setTimeout(() => {
			setShowHistory(false);
			setIsHistoryClosing(false);
		}, 300); // 300ms 匹配 CSS 动画时长
	};

	const handleShowRules = () => {
		playClickSound();
		setShowRules(true);
		setIsRulesClosing(false);
	};

	const handleCloseRules = () => {
		playClickSound();
		setIsRulesClosing(true);
		// 等待动画完成后再隐藏模态框
		setTimeout(() => {
			setShowRules(false);
			setIsRulesClosing(false);
		}, 300); // 300ms 匹配 CSS 动画时长
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
			subtitle: '「Dragon Nai」概率UP',
			image: nailongImage,
			description: '限定时间内，5星卡牌「Dragon Nai」获得概率大幅提升！',
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

	// 模拟历史记录数据
	const wishHistory = {
		featured: [
			{ id: 1, name: '盖亚——！！', rarity: 5, time: '2024-12-25 14:30', type: '限定祈愿' },
			{ id: 2, name: 'Paimon', rarity: 4, time: '2024-12-25 14:25', type: '限定祈愿' },
			{ id: 3, name: '冰', rarity: 3, time: '2024-12-25 14:20', type: '限定祈愿' },
			{ id: 4, name: 'Dragon Nai', rarity: 5, time: '2024-12-24 20:15', type: '限定祈愿' },
			{ id: 5, name: '坤', rarity: 4, time: '2024-12-24 20:10', type: '限定祈愿' },
		],
		standard: [
			{ id: 6, name: '杰哥', rarity: 5, time: '2024-12-25 10:45', type: '常驻祈愿' },
			{ id: 7, name: 'man', rarity: 4, time: '2024-12-25 10:40', type: '常驻祈愿' },
			{ id: 8, name: 'wlm', rarity: 3, time: '2024-12-25 10:35', type: '常驻祈愿' },
			{ id: 9, name: 'Paimon', rarity: 4, time: '2024-12-24 16:20', type: '常驻祈愿' },
			{ id: 10, name: '冰', rarity: 3, time: '2024-12-24 16:15', type: '常驻祈愿' },
		]
	};

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
			<p className="character-subtitle">{selectedBanner === 'featured' ? '限定UP' : '常驻卡牌'}</p>
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

	// 历史记录渲染函数
	const renderHistoryModal = () => {
		if (!showHistory) return null;

		const getRarityColor = (rarity: number) => {
			switch (rarity) {
				case 5: return '#FFD700'; // 金色
				case 4: return '#9932CC'; // 紫色
				case 3: return '#4169E1'; // 蓝色
				default: return '#808080'; // 灰色
			}
		};

		const renderHistoryList = (records: any[], title: string) => (
			<div className="history-column">
				<h3>{title}</h3>
				<div className="history-list">
					{records.length > 0 ? (
						records.map((record) => (
							<div key={record.id} className="history-item">
								<div className="history-item-main">
									<span
										className="history-item-name"
										style={{ color: getRarityColor(record.rarity) }}
									>
										{record.name}
									</span>
									<div className="history-item-stars">
										{[...Array(record.rarity)].map((_, i) => (
											<span key={i} className="history-star">⭐</span>
										))}
									</div>
								</div>
								<div className="history-item-time">{record.time}</div>
							</div>
						))
					) : (
						<div className="history-empty">暂无记录</div>
					)}
				</div>
			</div>
		);

		return (
			<div className={`history-modal-overlay ${isHistoryClosing ? 'closing' : ''}`} onClick={handleCloseHistory}>
				<div className={`history-modal ${isHistoryClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
					<div className="history-header">
						<h2>祈愿历史记录</h2>
						<button className="history-close-btn" onClick={handleCloseHistory}>
							✕
						</button>
					</div>
					<div className="history-content">
						{renderHistoryList(wishHistory.featured, '限定祈愿历史')}
						{renderHistoryList(wishHistory.standard, '常驻祈愿历史')}
					</div>
				</div>
			</div>
		);
	};

	// 渲染祈愿规则模态框
	const renderRulesModal = () => {
		if (!showRules) return null;

		return (
			<div className={`rules-modal-overlay ${isRulesClosing ? 'closing' : ''}`} onClick={handleCloseRules}>
				<div className={`rules-modal ${isRulesClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
					<div className="rules-header">
						<h2>祈愿规则说明</h2>
						<button className="rules-close-btn" onClick={handleCloseRules}>
							✕
						</button>
					</div>
					<div className="rules-content">
						<div className="rules-section">
							<h3>🌟 限定祈愿池</h3>
							<div className="rules-details">
								<h4>卡池特色：</h4>
								<ul>
									<li>限时开放，活动期间概率UP</li>
									<li>包含当期限定5星卡牌</li>
									<li>首次5星保底机制</li>
								</ul>

								<h4>抽卡概率：</h4>
								<div className="probability-table">
									<div className="prob-row">
										<span className="prob-rarity legendary">5星卡牌</span>
										<span className="prob-rate">0.6%</span>
										<span className="prob-detail">90抽内必出</span>
									</div>
									<div className="prob-row">
										<span className="prob-rarity epic">4星卡牌</span>
										<span className="prob-rate">5.5%</span>
										<span className="prob-detail">10抽内必出</span>
									</div>
									<div className="prob-row">
										<span className="prob-rarity rare">3星卡牌</span>
										<span className="prob-rate">93.9%</span>
										<span className="prob-detail">基础概率</span>
									</div>
								</div>

								<h4>保底机制：</h4>
								<ul>
									<li><strong>硬保底：</strong>90抽内必出5星卡牌</li>
									<li><strong>软保底：</strong>从第74抽开始，5星概率逐步提升</li>
									<li><strong>十连保底：</strong>十连抽必出至少1个4星或以上</li>
									<li><strong>UP保底：</strong>首次获得5星卡牌有50%概率为UP卡牌，如非UP卡牌，下次5星必为UP卡牌</li>
								</ul>
							</div>
						</div>

						<div className="rules-section">
							<h3>⭐ 常驻祈愿池</h3>
							<div className="rules-details">
								<h4>卡池特色：</h4>
								<ul>
									<li>永久开放，无时间限制</li>
									<li>包含所有基础卡牌</li>
									<li>稳定的获取渠道</li>
								</ul>

								<h4>抽卡概率：</h4>
								<div className="probability-table">
									<div className="prob-row">
										<span className="prob-rarity legendary">5星卡牌</span>
										<span className="prob-rate">0.6%</span>
										<span className="prob-detail">90抽内必出</span>
									</div>
									<div className="prob-row">
										<span className="prob-rarity epic">4星卡牌</span>
										<span className="prob-rate">5.5%</span>
										<span className="prob-detail">10抽内必出</span>
									</div>
									<div className="prob-row">
										<span className="prob-rarity rare">3星卡牌</span>
										<span className="prob-rate">93.9%</span>
										<span className="prob-detail">基础概率</span>
									</div>
								</div>

								<h4>保底机制：</h4>
								<ul>
									<li><strong>硬保底：</strong>90抽内必出5星卡牌</li>
									<li><strong>软保底：</strong>从第74抽开始，5星概率逐步提升</li>
									<li><strong>十连保底：</strong>十连抽必出至少1个4星或以上</li>
									<li><strong>随机5星：</strong>所有5星卡牌均等概率获得</li>
								</ul>
							</div>
						</div>

						<div className="rules-section">
							<h3>💎 消耗与建议</h3>
							<div className="rules-details">
								<h4>原石消耗：</h4>
								<ul>
									<li><strong>单次祈愿：</strong>160原石</li>
									<li><strong>十连祈愿：</strong>1600原石</li>
								</ul>

								<h4>祈愿建议：</h4>
								<ul>
									<li>推荐使用十连祈愿，享受十连保底</li>
									<li>限定卡池适合追求特定卡牌的玩家</li>
									<li>常驻卡池适合新手快速获得基础卡牌</li>
									<li>理性祈愿，量力而行</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	return (
		<PageTransition className="card-page">
			<div className="wish-page">
				<header className="page-header">
					<button className="back-btn" onClick={handleBackToHome}>
						← 返回主页
					</button>
					<h1>卡牌祈愿</h1>
					<div className="header-right">
						<div className="user-currency-header">
							<img src={primogemIcon} alt="原石" className="currency-icon" />
							<span className="currency-amount">{user?.coins}</span>
						</div>
						<button className="rules-btn" onClick={handleShowRules}>
							📋 祈愿规则
						</button>
						<button className="history-btn" onClick={handleShowHistory}>
							📜 历史记录
						</button>
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
			{renderHistoryModal()}
			{renderRulesModal()}
		</PageTransition>
	);
};

export default WishPage;
