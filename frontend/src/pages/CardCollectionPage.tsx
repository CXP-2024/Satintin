import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './CardCollectionPage.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from '../utils/soundUtils';

const CardCollectionPage: React.FC = () => {
	const { user } = useAuthStore();
	const { navigateQuick } = usePageTransition();
	const [activeTab, setActiveTab] = useState<'deck' | 'collection'>('deck');

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

	const renderDeckContent = () => (
		<div className="deck-content">
			<div className="deck-info">
				<h3>当前卡组</h3>
				<p>请选择最多30张卡牌组成你的战斗卡组</p>
				<div className="deck-stats">
					<span className="card-count">18/30 张卡牌</span>
					<span className="deck-cost">平均费用: 3.2</span>
				</div>
			</div>

			<div className="deck-grid">
				<div className="card-slot filled">
					<div className="card common">
						<div className="card-cost">2</div>
						<div className="card-name">穿透卡</div>
						<div className="card-rarity">普通</div>
						<div className="card-count">x3</div>
					</div>
				</div>
				<div className="card-slot filled">
					<div className="card rare">
						<div className="card-cost">4</div>
						<div className="card-name">发育卡</div>
						<div className="card-rarity">稀有</div>
						<div className="card-count">x2</div>
					</div>
				</div>
				<div className="card-slot filled">
					<div className="card epic">
						<div className="card-cost">3</div>
						<div className="card-name">反弹卡</div>
						<div className="card-rarity">史诗</div>
						<div className="card-count">x2</div>
					</div>
				</div>
				<div className="card-slot filled">
					<div className="card legendary">
						<div className="card-cost">6</div>
						<div className="card-name">毁灭卡</div>
						<div className="card-rarity">传说</div>
						<div className="card-count">x1</div>
					</div>
				</div>
				{/* 空槽位 */}
				{Array.from({ length: 8 }, (_, i) => (
					<div key={i} className="card-slot empty">
						<div className="add-card">+</div>
					</div>
				))}
			</div>

			<div className="deck-actions">
				<button className="deck-btn save">保存卡组</button>
				<button className="deck-btn clear">清空卡组</button>
				<button className="deck-btn preset">预设卡组</button>
			</div>
		</div>
	);

	const renderCollectionContent = () => (
		<div className="collection-content">
			<div className="collection-filters">
				<div className="filter-group">
					<label>稀有度筛选</label>
					<div className="rarity-filters">
						<button className="filter-btn active">全部</button>
						<button className="filter-btn common">普通</button>
						<button className="filter-btn rare">稀有</button>
						<button className="filter-btn epic">史诗</button>
						<button className="filter-btn legendary">传说</button>
					</div>
				</div>
				<div className="filter-group">
					<label>费用筛选</label>
					<div className="cost-filters">
						<button className="filter-btn active">全部</button>
						<button className="filter-btn">1-2</button>
						<button className="filter-btn">3-4</button>
						<button className="filter-btn">5-6</button>
						<button className="filter-btn">7+</button>
					</div>
				</div>
			</div>

			<div className="collection-stats">
				<div className="stat-item">
					<span className="stat-number">45</span>
					<span className="stat-label">拥有卡牌</span>
				</div>
				<div className="stat-item">
					<span className="stat-number">120</span>
					<span className="stat-label">总卡牌数</span>
				</div>
				<div className="stat-item">
					<span className="stat-number">37.5%</span>
					<span className="stat-label">收集进度</span>
				</div>
			</div>

			<div className="collection-grid">
				<div className="collection-card common owned">
					<div className="card-cost">2</div>
					<div className="card-name">穿透卡</div>
					<div className="card-rarity">普通</div>
					<div className="card-owned">已拥有 x5</div>
				</div>
				<div className="collection-card rare owned">
					<div className="card-cost">4</div>
					<div className="card-name">发育卡</div>
					<div className="card-rarity">稀有</div>
					<div className="card-owned">已拥有 x3</div>
				</div>
				<div className="collection-card epic owned">
					<div className="card-cost">3</div>
					<div className="card-name">反弹卡</div>
					<div className="card-rarity">史诗</div>
					<div className="card-owned">已拥有 x2</div>
				</div>
				<div className="collection-card legendary owned">
					<div className="card-cost">6</div>
					<div className="card-name">毁灭卡</div>
					<div className="card-rarity">传说</div>
					<div className="card-owned">已拥有 x1</div>
				</div>
				<div className="collection-card common not-owned">
					<div className="card-cost">1</div>
					<div className="card-name">治疗卡</div>
					<div className="card-rarity">普通</div>
					<div className="card-owned">未拥有</div>
				</div>
				<div className="collection-card rare not-owned">
					<div className="card-cost">5</div>
					<div className="card-name">爆发卡</div>
					<div className="card-rarity">稀有</div>
					<div className="card-owned">未拥有</div>
				</div>
			</div>
		</div>
	);

	return (
		<PageTransition className="card-page">
			<div className="card-collection-page">
				<header className="page-header">
					<button className="back-btn" onClick={handleBackToHome}>
						← 返回主页
					</button>
					<h1>卡组管理</h1>
					<div className="collection-progress">
						<span className="progress-label">收集进度</span>
						<div className="progress-bar">
							<div className="progress-fill" style={{ width: '37.5%' }}></div>
						</div>
						<span className="progress-text">45/120</span>
					</div>
				</header>

				<nav className="tab-nav">
					<button
						className={`tab-btn ${activeTab === 'deck' ? 'active' : ''}`}
						onClick={() => {
							playClickSound();
							setActiveTab('deck');
						}}
					>
						🃏 卡组编辑
					</button>
					<button
						className={`tab-btn ${activeTab === 'collection' ? 'active' : ''}`}
						onClick={() => {
							playClickSound();
							setActiveTab('collection');
						}}
					>
						📚 卡牌收藏
					</button>
				</nav>

				<main className="collection-main">
					{activeTab === 'deck' ? renderDeckContent() : renderCollectionContent()}
				</main>
			</div>
		</PageTransition>
	);
};

export default CardCollectionPage;
