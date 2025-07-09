import React, { useState, useEffect } from 'react';
import { usePageTransition } from '../../components/usePageTransition';
import PageTransition from '../../components/PageTransition';
import './CardCollectionPage.css';
import clickSound from '../../assets/sound/yinxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { GetPlayerCardsMessage } from 'Plugins/CardService/APIs/GetPlayerCardsMessage';
import { GetAllCardTemplatesMessage } from '../../Plugins/CardService/APIs/GetAllCardTemplatesMessage';
import { ConfigureBattleDeckMessage } from 'Plugins/CardService/APIs/ConfigureBattleDeckMessage';
import { LoadBattleDeckMessage } from 'Plugins/CardService/APIs/LoadBattleDeckMessage';
import { useUserToken } from 'Plugins/CommonUtils/Store/UserInfoStore';
import { CardEntry } from 'Plugins/CardService/Objects/CardEntry';
import { CARD_IMAGE_MAP } from '../../utils/cardImageMap';
import { useUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";
import { 
	DeckManager, 
	AllCardsTab, 
	ExtendedCardEntry, 
	CardTemplate, 
	TabType 
} from '../../components/cardCollection';
import { showSuccess } from 'utils/alertUtils';

const CardCollectionPage: React.FC = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
	const user = useUserInfo();
	const userID = user?.userID;
	const userToken = useUserToken();
	const { navigateQuick } = usePageTransition();
	
	// 用户卡牌数据状态
	const [userCards, setUserCards] = useState<ExtendedCardEntry[]>([]);
	const [allCardTemplates, setAllCardTemplates] = useState<CardTemplate[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selected, setSelected] = useState<ExtendedCardEntry[]>([]);
	
	const [showTab, setShowTab] = useState<TabType>('deck');
	const [animationClass, setAnimationClass] = useState<string>('');	// 从后端获取用户卡牌数据
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
			const cardEntries = typeof response === 'string' ? JSON.parse(response) : response;
			
			// 转换为扩展的卡牌格式
			const extendedCards: ExtendedCardEntry[] = cardEntries.map(card => ({
				id: card.userCardID,
				userCardID: card.userCardID,
				cardID: card.cardID,
				rarityLevel: card.rarityLevel,
				cardLevel: card.cardLevel,
				cardName: card.cardName,
				description: card.description,
				cardType: card.description,
				image: CARD_IMAGE_MAP[card.cardID] || null,
				owned: true,
				name: card.cardName,
				type: card.description,
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
				new GetAllCardTemplatesMessage().send(
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
	};	// 从后端加载用户的战斗卡组配置
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
	const playClickSound = () => SoundUtils.playClickSound(0.5);

	// 页面切换处理函数
	const handleTabSwitch = (newTab: TabType) => {
		if (newTab === showTab) return;

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
		}, 200);
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

	// 确定选择，发送卡组配置到后端
	const handleConfirmDeck = async () => {
		playClickSound();
		
		if (selected.length === 0) {
			alert('请至少选择一张卡牌！');
			return;
		}
		
		try {
			// 获取选中卡牌的cardID列表
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
			showSuccess('卡组配置成功！', '配置成功');
			
		} catch (err) {
			console.error('[CardCollectionPage] 卡组配置失败:', err);
			alert('卡组配置失败，请重试！');
		}
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
						<div className={`tab-content ${animationClass}`}>
							{showTab === 'deck' ? (
								<DeckManager
									userCards={userCards}
									selected={selected}
									onSelectionChange={setSelected}
									onConfirmDeck={handleConfirmDeck}
								/>
							) : (
								<AllCardsTab
									allCardTemplates={allCardTemplates}
									userCards={userCards}
									selected={selected}
									onSelect={handleSelect}
									isLoading={isLoading}
									isLoadingTemplates={isLoadingTemplates}
									error={error}
								/>
							)}
						</div>
					</div>
				</main>
			</div>
		</PageTransition>
	);
};

export default CardCollectionPage;
