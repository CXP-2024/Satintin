
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './CardCollectionPage.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from '../utils/soundUtils';

// 导入卡牌图片
import nailongImg from '../assets/images/nailong.png';
import gaiyaImg from '../assets/images/gaiya.png';
import mygoImg from '../assets/images/mygo.png';
import jiegeImg from '../assets/images/jiege.png';
import paimengImg from '../assets/images/paimeng.png';
import kunImg from '../assets/images/kun.png';
import manImg from '../assets/images/man.png';
import bingbingImg from '../assets/images/bingbing.png';
import wlmImg from '../assets/images/wlm.png';

// 具体卡牌数据（基于cards.md）
const CARDS_DATA = [
	// 传说卡牌 (5星)
	{ id: 'nailong', name: 'Dragon Nai', type: '反弹', rarity: '传说', image: nailongImg, owned: true },
	{ id: 'gaiya', name: '盖亚', type: '穿透', rarity: '传说', image: gaiyaImg, owned: false },
	{ id: 'mygo', name: 'Go', type: '发育', rarity: '传说', image: mygoImg, owned: false },
	{ id: 'jiege', name: '杰哥', type: '穿透', rarity: '传说', image: jiegeImg, owned: true },

	// 稀有卡牌 (4星)
	{ id: 'paimeng', name: 'Paimon', type: '反弹', rarity: '稀有', image: paimengImg, owned: true },
	{ id: 'kun', name: '坤', type: '穿透', rarity: '稀有', image: kunImg, owned: true },
	{ id: 'man', name: 'man', type: '发育', rarity: '稀有', image: manImg, owned: false },

	// 普通卡牌 (3星)
	{ id: 'bingbing', name: '冰', type: '反弹', rarity: '普通', image: bingbingImg, owned: true },
	{ id: 'wlm', name: 'wlm', type: '发育', rarity: '普通', image: wlmImg, owned: true },
	// 穿透普通卡牌暂缺，用占位符
	{ id: 'placeholder', name: '？？？', type: '穿透', rarity: '普通', image: null, owned: false },
];

// 卡牌类型和稀有度定义
const CARD_TYPES = [
	{
		type: '穿透',
		desc: '撒增加概率穿透对手防御',
		icon: '🗡️',
		effects: ['5%概率穿透防御', '15%概率穿透防御', '33%概率穿透防御'],
		color: '#e74c3c'
	},
	{
		type: '发育',
		desc: '饼增加概率获得2点能量',
		icon: '🌱',
		effects: ['5%概率获得2点能量', '15%概率获得2点能量', '33%概率获得2点能量'],
		color: '#27ae60'
	},
	{
		type: '反弹',
		desc: '防增加概率反弹撒攻击',
		icon: '🔄',
		effects: ['5%概率反弹撒攻击', '15%概率反弹撒攻击', '33%概率反弹撒攻击'],
		color: '#9b59b6'
	},
];

const RARITIES = [
	{ name: '普通', color: '#95a5a6', stars: 3 },
	{ name: '稀有', color: '#3498db', stars: 4 },
	{ name: '传说', color: '#f39c12', stars: 5 }
];

// 假设用户拥有的卡牌（实际应从后端获取）
const userCards = CARDS_DATA;

const CardCollectionPage: React.FC = () => {
	const { user } = useAuthStore();
	const { navigateQuick } = usePageTransition();
	const [selected, setSelected] = useState<typeof CARDS_DATA[0][]>([
		CARDS_DATA.find(c => c.id === 'jiege')!,
		CARDS_DATA.find(c => c.id === 'paimeng')!,
		CARDS_DATA.find(c => c.id === 'bingbing')!,
	]); // 默认三张
	const [showTab, setShowTab] = useState<'deck' | 'all'>('deck');

	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);
	const playClickSound = () => SoundUtils.playClickSound(0.5);
	const handleBack = () => {
		playClickSound();
		navigateQuick('/game');
	};

	// 选择卡组
	const handleSelect = (card: typeof CARDS_DATA[0]) => {
		playClickSound();
		if (!card.owned) return;
		// 已选则取消
		if (selected.find(sel => sel.id === card.id)) {
			setSelected(selected.filter(sel => sel.id !== card.id));
			return;
		}
		// 只能选3张
		if (selected.length >= 3) return;
		setSelected([...selected, card]);
	};

	// 一键清空
	const handleClear = () => {
		playClickSound();
		setSelected([]);
	};

	// 一键推荐（优先高稀有度）
	const handleRecommend = () => {
		playClickSound();
		const recommend: typeof CARDS_DATA[0][] = [];
		for (const t of CARD_TYPES) {
			for (const r of RARITIES.reverse()) {
				const card = CARDS_DATA.find(c => c.type === t.type && c.rarity === r.name && c.owned);
				if (card) {
					recommend.push(card);
					break;
				}
			}
		}
		RARITIES.reverse(); // 恢复原序
		setSelected(recommend);
	};

	const getRarityInfo = (rarity: string) => {
		return RARITIES.find(r => r.name === rarity) || RARITIES[0];
	};

	const getTypeInfo = (type: string) => {
		return CARD_TYPES.find(t => t.type === type) || CARD_TYPES[0];
	};

	return (
		<PageTransition className="card-page">
			<div className="card-collection-page">
				<header className="page-header">
					<button className="back-btn" onClick={handleBack}>← 返回大厅</button>
					<h1>卡组管理</h1>
				</header>

				<nav className="tab-nav">
					<button className={`tab-btn ${showTab === 'deck' ? 'active' : ''}`} onClick={() => { playClickSound(); setShowTab('deck'); }}>我的卡组</button>
					<button className={`tab-btn ${showTab === 'all' ? 'active' : ''}`} onClick={() => { playClickSound(); setShowTab('all'); }}>全部卡牌</button>
				</nav>

				<main className="collection-main">
					{showTab === 'deck' ? (
						<div className="deck-section">
							<h2>已选卡组（最多3张）</h2>
							<div className="deck-cards">
								{selected.length === 0 && <div className="empty-tip">请选择三张卡牌组成卡组</div>}
								{selected.map((card, idx) => {
									const rarityInfo = getRarityInfo(card.rarity);
									const typeInfo = getTypeInfo(card.type);
									const effectIndex = RARITIES.findIndex(r => r.name === card.rarity);
									return (
										<div key={card.id} className={`deck-card owned ${card.type}`}>
											<div className="card-image">
												{card.image ? (
													<img src={card.image} alt={card.name} />
												) : (
													<div className="placeholder-image">？</div>
												)}
											</div>
											<div className="card-info">
												<div className="card-name">{card.name}</div>
												<div className="card-type" style={{ color: typeInfo.color }}>
													{typeInfo.icon} {card.type}
												</div>
												<div className="card-rarity" style={{ color: rarityInfo.color }}>
													{'★'.repeat(rarityInfo.stars)} {card.rarity}
												</div>
												<div className="card-effect">{typeInfo.effects[effectIndex]}</div>
											</div>
											<button className="remove-btn" onClick={() => handleSelect(card)}>移除</button>
										</div>
									);
								})}
							</div>
							<div className="deck-actions">
								<button className="deck-btn recommend" onClick={handleRecommend}>一键推荐</button>
								<button className="deck-btn clear" onClick={handleClear}>清空卡组</button>
							</div>
							<div className="deck-tip">* 每场对战只能携带三张卡牌，合理搭配提升胜率！</div>
						</div>
					) : (
						<div className="all-cards-section">
							<h2>全部卡牌</h2>
							<div className="all-cards-grid">
								{CARDS_DATA.map((card) => {
									const rarityInfo = getRarityInfo(card.rarity);
									const typeInfo = getTypeInfo(card.type);
									const effectIndex = RARITIES.findIndex(r => r.name === card.rarity);
									const isSelected = selected.find(sel => sel.id === card.id);
									return (
										<div key={card.id}
											className={`all-card ${card.owned ? 'owned' : 'not-owned'} ${card.type} ${isSelected ? 'selected' : ''}`}
											onClick={() => handleSelect(card)}>
											<div className="card-image">
												{card.image ? (
													<img src={card.image} alt={card.name} />
												) : (
													<div className="placeholder-image">？</div>
												)}
											</div>
											<div className="card-info">
												<div className="card-name">{card.name}</div>
												<div className="card-type" style={{ color: typeInfo.color }}>
													{typeInfo.icon} {card.type}
												</div>
												<div className="card-rarity" style={{ color: rarityInfo.color }}>
													{'★'.repeat(rarityInfo.stars)} {card.rarity}
												</div>
												<div className="card-effect">{typeInfo.effects[effectIndex]}</div>
											</div>
											{!card.owned && <div className="not-owned-overlay">未拥有</div>}
											{isSelected && <div className="selected-overlay">已选择</div>}
										</div>
									);
								})}
							</div>
							<div className="all-cards-tip">* 只有已拥有的卡牌才能加入卡组</div>
						</div>
					)}
				</main>
			</div>
		</PageTransition>
	);
};

export default CardCollectionPage;
