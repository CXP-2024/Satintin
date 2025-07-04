import React, { useState, useEffect } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './CardCollectionPage.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { GetPlayerCardsMessage } from 'Plugins/CardService/APIs/GetPlayerCardsMessage';
import { GetAllCardTemplatesMessage } from '../Plugins/CardService/APIs/GetAllCardTemplatesMessage';
import { ConfigureBattleDeckMessage } from 'Plugins/CardService/APIs/ConfigureBattleDeckMessage';
import { LoadBattleDeckMessage } from 'Plugins/CardService/APIs/LoadBattleDeckMessage';
import { useUserToken } from 'Plugins/CommonUtils/Store/UserInfoStore';
import { CardEntry } from 'Plugins/CardService/Objects/CardEntry';

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
import {useUserInfo} from "Plugins/CommonUtils/Store/UserInfoStore";

// 卡牌图片映射
const CARD_IMAGES: Record<string, any> = {
	// 旧格式（兼容性）
	'nailong': nailongImg,
	'gaiya': gaiyaImg,
	'mygo': mygoImg,
	'jiege': jiegeImg,
	'paimeng': paimengImg,
	'kun': kunImg,
	'man': manImg,
	'bingbing': bingbingImg,
	'wlm': wlmImg,
	// 新格式（匹配后端模板ID）
	'template-ice': bingbingImg, // 冰 -> bingbing
	'template-wlm': wlmImg,      // wlm -> wlm
	'template-man': manImg,      // man -> man  
	'template-kun': kunImg,      // 坤 -> kun
	'template-paimon': paimengImg, // Paimon -> paimeng
	'template-dragon-nai': nailongImg, // Dragon Nai -> nailong
	'template-gaia': gaiyaImg,   // 盖亚 -> gaiya
	'template-go': mygoImg,      // Go -> mygo
	'template-jie': jiegeImg,    // 杰哥 -> jiege
};

// 扩展的卡牌数据接口，兼容前端展示需求
interface ExtendedCardEntry {
	id: string; // 映射到 userCardID
	userCardID: string;
	cardID: string;
	rarityLevel: string;
	cardLevel: number;
	cardName: string;
	description: string;
	cardType: string;
	image?: any;
	owned: boolean;
	name: string; // 映射到 cardName
	type: string; // 映射到 description
	rarity: string; // 映射到 rarityLevel
}

// 卡牌模板接口（用于全部卡牌展示）
interface CardTemplate {
	cardID: string;
	cardName: string;
	rarity: string;
	description: string;
	cardType: string;
}

// 具体卡牌数据（基于cards.md）- 保留作为图片映射参考
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
// const userCards = CARDS_DATA;

const CardCollectionPage: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
	const user = useUserInfo();
	const userID = user?.userID;
	const userToken = useUserToken();
	const { navigateQuick } = usePageTransition();
	// 用户卡牌数据状态
	const [userCards, setUserCards] = useState<ExtendedCardEntry[]>([]);
	const [allCardTemplates, setAllCardTemplates] = useState<CardTemplate[]>([]); // 全部卡牌模板
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingTemplates, setIsLoadingTemplates] = useState(true); // 模板加载状态
	const [error, setError] = useState<string | null>(null);// 卡组选择状态 - 直接在主界面操作
	const [uniqueCards, setUniqueCards] = useState<ExtendedCardEntry[]>([]); // 去重后的卡牌种类
	const [cardCounts, setCardCounts] = useState<Record<string, number>>({}); // 每种卡牌的拥有数量
	const [selected, setSelected] = useState<ExtendedCardEntry[]>([]); // 已选择的卡牌
	
	const [showTab, setShowTab] = useState<'deck' | 'all'>('deck');
	const [removingCard, setRemovingCard] = useState<string | null>(null);
	const [rearranging, setRearranging] = useState<boolean>(false);
	const [animationClass, setAnimationClass] = useState<string>('');// 从后端获取用户卡牌数据
	const fetchUserCards = async () => {
		try {
			setIsLoading(true);
			setError(null);
			
			// 使用回调方式调用 API
			const response: any = await new Promise((resolve, reject) => {
				new GetPlayerCardsMessage(userID).send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});
			
			// 解析响应数据
			const cardEntries = typeof response === 'string' ? JSON.parse(response) : response;			// 转换为扩展的卡牌格式
			const extendedCards: ExtendedCardEntry[] = cardEntries.map(card => ({
				id: card.userCardID, // 使用 userCardID 作为唯一标识
				userCardID: card.userCardID,
				cardID: card.cardID,
				rarityLevel: card.rarityLevel,
				cardLevel: card.cardLevel,
				cardName: card.cardName,
				description: card.description,
				cardType: card.description, // 使用 description 作为 cardType
				image: CARD_IMAGES[card.cardID] || null,
				owned: true,
				name: card.cardName,
				type: card.description, // 使用 description 作为 type
				rarity: card.rarityLevel
			}));
					setUserCards(extendedCards);
					// 首先尝试加载用户的战斗卡组配置
			const loadedDeck = await loadBattleDeck(extendedCards);
					// 如果没有配置的卡组或加载失败，则初始化默认卡组（选择前三张卡牌）
			if (!loadedDeck && extendedCards.length > 0 && selected.length === 0) {
				const defaultDeck = extendedCards.slice(0, Math.min(3, extendedCards.length));
				setSelected(defaultDeck);
				console.log('[CardCollectionPage] 使用默认卡组:', defaultDeck);
			}
			
		} catch (err) {
			console.error('[CardCollectionPage] 获取用户卡牌数据失败:', err);
			setError('获取用户卡牌数据失败');
		} finally {
			setIsLoading(false);
		}
	};	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
		if (userID) {
			fetchUserCards();
			fetchAllCardTemplates();
		}
	}, [userID]); 
	// 从后端获取全部卡牌模板
	const fetchAllCardTemplates = async () => {
		try {
			setIsLoadingTemplates(true);
			setError(null);
			
			// 使用回调方式调用 API
			const response: any = await new Promise((resolve, reject) => {
				new GetAllCardTemplatesMessage(userID).send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});
			
			// 解析响应数据
			const templates = typeof response === 'string' ? JSON.parse(response) : response;
			console.log('[CardCollectionPage] 获取到的卡牌模板:', templates);
			
			setAllCardTemplates(templates);
			
		} catch (err) {
			console.error('[CardCollectionPage] 获取卡牌模板失败:', err);
			setError('获取卡牌模板失败');
		} finally {
			setIsLoadingTemplates(false);
		}
	};
	// 从后端加载用户的战斗卡组配置
	const loadBattleDeck = async (availableCards: ExtendedCardEntry[]) => {
		try {
			console.log('[CardCollectionPage] 开始加载用户战斗卡组配置');
			
			// 使用回调方式调用 API
			const response: any = await new Promise((resolve, reject) => {
				new LoadBattleDeckMessage(userID).send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});
			
			// 解析响应数据
			const battleDeckCardIds = typeof response === 'string' ? JSON.parse(response) : response;
			console.log('[CardCollectionPage] 获取到的战斗卡组配置:', battleDeckCardIds);
			
			// 如果有配置的卡组，根据cardID找到对应的用户卡牌
			if (Array.isArray(battleDeckCardIds) && battleDeckCardIds.length > 0) {
				const battleDeckCards: ExtendedCardEntry[] = [];
				
				battleDeckCardIds.forEach(cardId => {
					// 找到第一个匹配cardID且未被选择的卡牌
					const matchingCard = availableCards.find(card => 
						card.cardID === cardId && 
						!battleDeckCards.find(selected => selected.id === card.id)
					);
					if (matchingCard) {
						battleDeckCards.push(matchingCard);
					}
				});
				
				console.log('[CardCollectionPage] 构建的战斗卡组:', battleDeckCards);
				setSelected(battleDeckCards);
				return true; // 成功加载了配置的卡组
			} else {
				console.log('[CardCollectionPage] 用户暂无战斗卡组配置，将使用默认卡组');
				return false; // 没有配置的卡组
			}
			
		} catch (err) {
			console.error('[CardCollectionPage] 加载战斗卡组配置失败:', err);
			return false; // 加载失败，使用默认卡组
		}
	};

	// 工具函数
	const getCardKey = (card: ExtendedCardEntry) => {
		return `${card.cardID}_${card.rarityLevel}`;
	};

	// 处理卡牌去重和计数
	useEffect(() => {
		if (userCards.length > 0) {
			const countMap: Record<string, number> = {};
			const uniqueMap: Record<string, ExtendedCardEntry> = {};

			userCards.forEach(card => {
				const cardKey = getCardKey(card);
				countMap[cardKey] = (countMap[cardKey] || 0) + 1;
				
				// 保留第一个遇到的卡牌作为代表
				if (!uniqueMap[cardKey]) {
					uniqueMap[cardKey] = card;
				}
			});

			setCardCounts(countMap);
			setUniqueCards(Object.values(uniqueMap));
		}
	}, [userCards]);
	const playClickSound = () => SoundUtils.playClickSound(0.5);

	// 页面切换处理函数
	const handleTabSwitch = (newTab: 'deck' | 'all') => {
		if (newTab === showTab) return; // 如果是同一个标签页，不执行动画

		playClickSound();

		// 确定动画方向
		const isMovingRight = (showTab === 'deck' && newTab === 'all');
		const outClass = isMovingRight ? 'slide-out-left' : 'slide-out-right';
		const inClass = isMovingRight ? 'slide-in-right' : 'slide-in-left';

		// 开始退出动画
		setAnimationClass(outClass);

		// 在退出动画完成后切换内容并开始进入动画
		setTimeout(() => {
			setShowTab(newTab);
			setAnimationClass(inClass);

			// 清除动画类
			setTimeout(() => {
				setAnimationClass('');
			}, 400);
		}, 200); // 一半的动画时间后切换内容
	};

	const handleBack = () => {
		playClickSound();
		navigateQuick('/game');
	};
	// 选择卡组
	const handleSelect = (card: ExtendedCardEntry) => {
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

	// 移除卡牌动画
	const handleRemoveCard = (card: ExtendedCardEntry) => {
		playClickSound();
		setRemovingCard(card.id);

		// 延迟移除，等待动画完成
		setTimeout(() => {
			setSelected(selected.filter(sel => sel.id !== card.id));
			setRemovingCard(null);

			// 触发重排动画
			setRearranging(true);
			setTimeout(() => setRearranging(false), 500);
		}, 300); // 卡牌消失动画时间
	};

	// 一键清空
	const handleClear = () => {
		playClickSound();
		setSelected([]);
	};
	// 一键推荐（优先高稀有度）
	const handleRecommend = () => {
		playClickSound();
		const recommend: ExtendedCardEntry[] = [];
		for (const t of CARD_TYPES) {
			for (const r of RARITIES.reverse()) {
				const card = userCards.find(c => c.type === t.type && c.rarity === r.name && c.owned);
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
	};	// 新的卡牌选择逻辑 - 直接更新selected状态
	const handleCardClick = (cardKey: string) => {
		playClickSound();
		
		// 如果已选择的卡牌数量达到3张，则不能再选择
		if (selected.length >= 3) return;
		
		// 找到该类型的卡牌
		const card = uniqueCards.find(c => getCardKey(c) === cardKey);
		if (!card) return;
		
		// 检查是否还有该类型的卡牌可用
		const selectedOfThisType = selected.filter(c => getCardKey(c) === cardKey).length;
		const totalOfThisType = userCards.filter(c => getCardKey(c) === cardKey).length;
		
		if (selectedOfThisType >= totalOfThisType) return;
		
		// 找到一个未被选择的该类型卡牌实例
		const availableCard = userCards.find(c => 
			getCardKey(c) === cardKey && 
			!selected.find(s => s.id === c.id)
		);
		
		if (availableCard) {
			setSelected([...selected, availableCard]);
		}
	};

	const handleCardRightClick = (cardKey: string, e: React.MouseEvent) => {
		e.preventDefault();
		playClickSound();
		
		// 移除最后一个该类型的卡牌
		const lastCardIndex = selected.map(c => getCardKey(c)).lastIndexOf(cardKey);
		if (lastCardIndex !== -1) {
			const newSelected = [...selected];
			newSelected.splice(lastCardIndex, 1);
			setSelected(newSelected);
		}
	};
	const getRemainingCount = (cardKey: string) => {
		const totalOfThisType = userCards.filter(c => getCardKey(c) === cardKey).length;
		const selectedOfThisType = selected.filter(c => getCardKey(c) === cardKey).length;
		return Math.max(0, totalOfThisType - selectedOfThisType);
	};
	const isCardDisabled = (cardKey: string) => {
		// 如果已选择3张卡牌，则禁用所有卡牌
		if (selected.length >= 3) return true;
		
		// 如果该类型卡牌没有剩余数量，则禁用
		return getRemainingCount(cardKey) <= 0;
	};

	// 确定选择，发送卡组配置到后端
	const handleConfirmDeck = async () => {
		playClickSound();
		
		if (selected.length === 0) {
			alert('请至少选择一张卡牌！');
			return;
		}
				try {
			// 获取选中卡牌的cardID列表 (注意：后端期望cardID而不是userCardID)
			const cardIds = selected.map(card => card.cardID);
			
			console.log('[CardCollectionPage] 发送到后端的cardID列表:', cardIds);
			
			// 调用配置卡组API
			const response: any = await new Promise((resolve, reject) => {
				new ConfigureBattleDeckMessage(userID, cardIds).send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});
			
			console.log('[CardCollectionPage] 卡组配置成功:', response);
			alert('卡组配置成功！');
			
		} catch (err) {
			console.error('[CardCollectionPage] 卡组配置失败:', err);
			alert('卡组配置失败，请重试！');		}
	};

	// 直接点击已选择卡牌移除
	const handleSelectedCardClick = (card: ExtendedCardEntry) => {
		playClickSound();
		// 直接移除点击的卡牌，不需要动画
		setSelected(selected.filter(sel => sel.id !== card.id));
	};

	return (
		<PageTransition className="card-page">
			<div className="card-collection-page">
				<header className="page-header">
					<button className="back-btn" onClick={handleBack}>← 返回大厅</button>
					<h1>卡组管理</h1>
				</header>

				<nav className="tab-nav">
					<button className={`tab-btn ${showTab === 'deck' ? 'active' : ''}`} onClick={() => handleTabSwitch('deck')}>我的卡组</button>
					<button className={`tab-btn ${showTab === 'all' ? 'active' : ''}`} onClick={() => handleTabSwitch('all')}>全部卡牌</button>
				</nav>

				<main className="collection-main">
					<div className="tab-content-container">
						<div className={`tab-content ${animationClass}`}>							{showTab === 'deck' ? (
								<div className="deck-section">
									{/* 已选卡组区域 */}
									<h2>已选卡组（{selected.length}/3）</h2>
									<div className="deck-cards">
										{selected.length === 0 && <div className="empty-tip">请从下方选择三张卡牌组成卡组</div>}
										{selected.map((card, idx) => {
											const rarityInfo = getRarityInfo(card.rarity);
											const typeInfo = getTypeInfo(card.type);
											const effectIndex = RARITIES.findIndex(r => r.name === card.rarity);											return (
												<div 
													key={card.id} 
													className={`deck-card owned ${card.type} ${removingCard === card.id ? 'removing' : ''} ${rearranging ? 'rearranging' : ''}`}
													onClick={() => handleSelectedCardClick(card)}
													style={{ cursor: 'pointer' }}
													title="点击移除此卡牌"
												>
													<div className="card-image">
														{card.image ? (
															<img src={card.image} alt={card.name} />
														) : (
															<div className="placeholder-image">？</div>
														)}
													</div>													<div className="card-info">
														<div className="card-name">{card.name}</div>
														<div className="card-type" style={{ color: typeInfo.color }}>
															{typeInfo.icon} {card.type}
														</div>
														<div className="card-rarity" style={{ color: rarityInfo.color }}>
															{'★'.repeat(rarityInfo.stars)} {card.rarity}
														</div>
														<div className="card-effect">{typeInfo.effects[effectIndex]}</div>
													</div>
													<div className="click-to-remove-hint">点击移除</div>
												</div>
											);
										})}
									</div>
									
									{/* 操作按钮 */}
									<div className="deck-actions">
										<button className="deck-btn recommend" onClick={handleRecommend}>一键推荐</button>
										<button className="deck-btn clear" onClick={handleClear}>清空卡组</button>
										<button className="deck-btn confirm" onClick={handleConfirmDeck}>确定</button>
									</div>
									
									{/* 选卡区域 */}
									<div className="card-selection-area">
										<h3>选择卡牌</h3>
										<div className="selection-cards-grid">
											{uniqueCards.map(card => {
												const cardKey = getCardKey(card);
												const rarityInfo = getRarityInfo(card.rarity);
												const typeInfo = getTypeInfo(card.type);
												const effectIndex = RARITIES.findIndex(r => r.name === card.rarity);
												const remainingCount = getRemainingCount(cardKey);
												const disabled = isCardDisabled(cardKey);
												
												return (
													<div 
														key={cardKey} 
														className={`selection-card ${disabled ? 'disabled' : 'owned'} ${card.type}`}
														onClick={() => handleCardClick(cardKey)}
														onContextMenu={(e) => handleCardRightClick(cardKey, e)}
													>
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
														<div className="card-remaining-count">剩余: {remainingCount}</div>
													</div>
												);
											})}
										</div>
									</div>
									
									<div className="deck-tip">
										* 左键点击选择卡牌，右键点击移除选择<br/>
										* 灰色卡牌表示数量不足或已达到3张上限<br/>
										* 每场对战只能携带三张卡牌，合理搭配提升胜率！
									</div>
								</div>							) : (
								<div className="all-cards-section">
									<h2>全部卡牌</h2>
									{(isLoading || isLoadingTemplates) && <div className="loading-tip">正在加载卡牌数据...</div>}
									{error && <div className="error-tip">{error}</div>}
									{!isLoading && !isLoadingTemplates && !error && (
										<>
											<div className="all-cards-grid">
												{allCardTemplates.map((template) => {
													const rarityInfo = getRarityInfo(template.rarity);
													const typeInfo = getTypeInfo(template.description);
													const effectIndex = RARITIES.findIndex(r => r.name === template.rarity);
													
													// 检查用户是否拥有这种卡牌
													const userOwnedCards = userCards.filter(card => card.cardID === template.cardID);
													const isOwned = userOwnedCards.length > 0;
													const ownedCount = userOwnedCards.length;
													
													// 检查是否有选中的卡牌
													const selectedCards = selected.filter(sel => sel.cardID === template.cardID);
													const isSelected = selectedCards.length > 0;
													
													return (
														<div key={template.cardID}
															className={`all-card ${isOwned ? 'owned' : 'not-owned'} ${template.description} ${isSelected ? 'selected' : ''}`}
															onClick={isOwned ? () => {
																// 如果拥有该卡牌，可以选择第一张未选中的
																const availableCard = userOwnedCards.find(card => 
																	!selected.find(sel => sel.id === card.id)
																);
																if (availableCard && selected.length < 3) {
																	handleSelect(availableCard);
																}
															} : undefined}
															style={{ cursor: isOwned ? 'pointer' : 'not-allowed' }}
														>
															<div className="card-image">
																{CARD_IMAGES[template.cardID] ? (
																	<img src={CARD_IMAGES[template.cardID]} alt={template.cardName} />
																) : (
																	<div className="placeholder-image">？</div>
																)}
															</div>
															<div className="card-info">
																<div className="card-name">{template.cardName}</div>
																<div className="card-type" style={{ color: typeInfo.color }}>
																	{typeInfo.icon} {template.description}
																</div>
																<div className="card-rarity" style={{ color: rarityInfo.color }}>
																	{'★'.repeat(rarityInfo.stars)} {template.rarity}
																</div>
																<div className="card-effect">{typeInfo.effects[effectIndex]}</div>
															</div>
															{!isOwned && <div className="not-owned-overlay">未拥有</div>}
															{isOwned && ownedCount > 1 && <div className="owned-count-overlay">x{ownedCount}</div>}
															{isSelected && <div className="selected-overlay">已选择</div>}
														</div>
													);
												})}
											</div>
											<div className="all-cards-tip">* 只有已拥有的卡牌才能加入卡组 * 灰色卡牌表示未拥有</div>
										</>
									)}
								</div>
							)}
						</div>
					</div>
				</main>
			</div>
		</PageTransition>
	);
};

export default CardCollectionPage;
