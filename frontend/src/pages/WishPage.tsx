import React, { useState, useEffect } from 'react';
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';
import './WishPage.css';
import primogemIcon from '../assets/images/primogem-icon.png';
import nailongImage from '../assets/images/nailong.webp';
import jiegeImage from '../assets/images/jiege.png';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import {useUserInfo, useUserToken, setUserInfoField} from "Plugins/CommonUtils/Store/UserInfoStore";
import { DrawCardMessage } from '../Plugins/CardService/APIs/DrawCardMessage';
import { QueryAssetStatusMessage } from '../Plugins/AssetService/APIs/QueryAssetStatusMessage'; // 添加导入
import { QueryCardDrawCountMessage } from '../Plugins/AssetService/APIs/QueryCardDrawCountMessage'; // 添加抽卡次数查询
import { GetDrawHistoryMessage, DrawHistoryEntry } from '../Plugins/CardService/APIs/GetDrawHistoryMessage';


const WishPage: React.FC = () => {
	const user = useUserInfo();
	const userID = user?.userID;
	const { navigateQuick } = usePageTransition();
	const [selectedBanner, setSelectedBanner] = useState<'standard' | 'featured'>('featured');
	const [showHistory, setShowHistory] = useState(false);
	const [showRules, setShowRules] = useState(false);
	const [isHistoryClosing, setIsHistoryClosing] = useState(false);	const [isRulesClosing, setIsRulesClosing] = useState(false);
	const [animationClass, setAnimationClass] = useState<string>('');
	const [isAnimating, setIsAnimating] = useState<boolean>(false);	const [wishHistory, setWishHistory] = useState<{featured: any[], standard: any[]}>({
		featured: [],
		standard: []
	});	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [cardDrawCounts, setCardDrawCounts] = useState<{standard: number, featured: number}>({
		standard: 0,
		featured: 0
	}); // 分离的抽卡次数

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	const handleNavigateToShop = () => {
		playClickSound();		
		navigateQuick('/shop');
	}
	// 卡池切换处理函数
	const handleBannerSwitch = (newBanner: 'standard' | 'featured') => {
		if (newBanner === selectedBanner || isAnimating) return;

		playClickSound();
		setIsAnimating(true);

		// 确定滑动方向
		const isSlideLeft = (selectedBanner === 'featured' && newBanner === 'standard');
		const slideOutClass = isSlideLeft ? 'slide-left-out' : 'slide-right-out';
		const slideInClass = isSlideLeft ? 'slide-left-in' : 'slide-right-in';

		// 开始退出动画
		setAnimationClass(slideOutClass);

		// 在退出动画完成后切换内容并开始进入动画
		setTimeout(() => {
			setSelectedBanner(newBanner);
			setAnimationClass(slideInClass);

			// 切换卡池时刷新对应卡池的抽卡次数（如果还没有加载过）
			if (userID && cardDrawCounts[newBanner] === 0) {
				fetchCardDrawCount(newBanner);
			}

			// 进入动画完成后清除动画类
			setTimeout(() => {
				setAnimationClass('');
				setIsAnimating(false);
			}, 600); // 匹配CSS动画时长
		}, 300); // 退出动画一半时间后切换内容
	};
	const handleShowHistory = async () => {
		playClickSound();
		setShowHistory(true);
		setIsHistoryClosing(false);
		// 显示历史记录时刷新数据
		await loadDrawHistory();
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
	// 添加刷新用户资产状态的函数
	const refreshUserAssets = async () => {
		// if (!user?.userID) return;
		try {
			// wrap send() so `response` is what your callback receives
			const response: any = await new Promise((resolve, reject) => {
			new QueryAssetStatusMessage(userID).send(
				(res: any)  => resolve(res),
				(err: any) => reject(err)
			);			});
			
			// 2. normalize to number
			let stoneAmount: number;
			stoneAmount = +response;
					// 3. update store using setUserInfoField to properly trigger state updates
			setUserInfoField('stoneAmount', stoneAmount);
		} catch (err) {
			console.error('刷新用户资产失败:', err);
		}
	};
	// 获取用户指定卡池的当前抽卡次数
	const fetchCardDrawCount = async (poolType: 'standard' | 'featured') => {
		if (!userID) return;

		try {
			const response: any = await new Promise((resolve, reject) => {
				new QueryCardDrawCountMessage(userID, poolType).send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});

			// 解析响应数据
			const drawCount = typeof response === 'string' ? parseInt(response) : Number(response);
			setCardDrawCounts(prev => ({
				...prev,
				[poolType]: drawCount
			}));
		} catch (err) {
			console.error(`获取${poolType}池抽卡次数失败:`, err);
			setCardDrawCounts(prev => ({
				...prev,
				[poolType]: 0
			}));
		}
	};

	// 获取所有卡池的抽卡次数
	const fetchAllCardDrawCounts = async () => {
		if (!userID) return;
		
		await Promise.all([
			fetchCardDrawCount('standard'),
			fetchCardDrawCount('featured')
		]);
	};

	const handleSingleWish = async () => {
		playClickSound();

		// 检查用户是否有足够的原石
		if (!user || user.stoneAmount < currentBanner.singleCost) {
			alert('原石不足！');
			return;
		}

		try {
			// 调用后端抽卡API - 修改为双回调模式
			const drawResult = await new Promise((resolve, reject) => {
				new DrawCardMessage(
					userID, 
					1, // 抽卡数量
					selectedBanner // 传入卡池类型
				).send(
					(response: any) => {
						console.log('抽卡成功响应:', response);
						resolve(response);
					},
					(error: any) => {
						console.error('抽卡失败:', error);
						reject(error);
					}
				);
			});

			console.log('Stored drawResult:', JSON.stringify(drawResult));
			
			// 解析响应数据 - 关键修改在这里
			let parsedResult: any;
			if (typeof drawResult === 'string') {
				try {
					parsedResult = JSON.parse(drawResult);
				} catch (e) {
					console.error('解析抽卡结果失败:', e);
					parsedResult = { cardList: [], isNewCard: false };
				}
			} else {
				parsedResult = drawResult;
			}
			
			// 检查返回的数据结构
			const cardList = parsedResult.cardList || [];
			const isNewCard = parsedResult.isNewCard || false;
			
			console.log('CardList:', cardList);
			console.log('IsNewCard:', isNewCard);

			// 抽卡成功后立即更新当前卡池的抽卡次数（单抽+1）
			setCardDrawCounts(prev => ({
				...prev,
				[selectedBanner]: prev[selectedBanner] + 1
			}));
			
			// 抽卡成功后刷新用户资产状态
			await refreshUserAssets();
			
			// 刷新抽卡历史和抽卡次数（从服务器获取最新数据）
			await loadDrawHistory();
			await fetchCardDrawCount(selectedBanner);
			
			// 传递新的抽卡结果数据结构
			const resultData = {
				cardList: cardList,
				isNewCard: isNewCard,
				type: 'single',
				banner: selectedBanner
			};
			
			console.log('Setting localStorage with:', resultData);
			localStorage.setItem('drawResult', JSON.stringify(resultData));
			
			navigateQuick('/wish-result');
		} catch (error) {
			console.error('抽卡失败:', error);
			alert('抽卡失败，请重试！');
		}
	};

	const handleTenWish = async () => {
		playClickSound();

		// 检查用户是否有足够的原石
		if (!user || user.stoneAmount < currentBanner.tenCost) {
			alert('原石不足！');
			return;
		}

		try {
			// 调用后端抽卡API - 修改为双回调模式
			const drawResult = await new Promise((resolve, reject) => {
				new DrawCardMessage(
					userID, 
					10, // 抽卡数量
					selectedBanner // 传入卡池类型
				).send(
					(response: any) => {
						console.log('十连抽卡成功响应:', response);
						resolve(response);
					},
					(error: any) => {
						console.error('十连抽卡失败:', error);
						reject(error);
					}
				);
			});

			console.log('Ten draw result:', JSON.stringify(drawResult));
			
			// 解析响应数据 - 关键修改在这里
			let parsedResult: any;
			if (typeof drawResult === 'string') {
				try {
					parsedResult = JSON.parse(drawResult);
				} catch (e) {
					console.error('解析十连抽卡结果失败:', e);
					parsedResult = { cardList: [], isNewCard: false };
				}
			} else {
				parsedResult = drawResult;
			}
			
			// 检查返回的数据结构
			const cardList = parsedResult.cardList || [];
			const isNewCard = parsedResult.isNewCard || false;
			
			// 抽卡成功后立即更新当前卡池的抽卡次数（十连+10）
			setCardDrawCounts(prev => ({
				...prev,
				[selectedBanner]: prev[selectedBanner] + 10
			}));
			
			// 抽卡成功后刷新用户资产状态
			await refreshUserAssets();

			// 刷新抽卡历史和抽卡次数（从服务器获取最新数据）
			await loadDrawHistory();
			await fetchCardDrawCount(selectedBanner);

			// 传递新的抽卡结果数据结构
			const resultData = {
				cardList: cardList,
				isNewCard: isNewCard,
				type: 'ten',
				banner: selectedBanner
			};
			
			localStorage.setItem('drawResult', JSON.stringify(resultData));
			
			navigateQuick('/wish-result');
		} catch (error) {
			console.error('抽卡失败:', error);
			alert('抽卡失败，请重试！');
		}
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
	// 加载抽卡历史记录
	const loadDrawHistory = async () => {
		if (!userID) {
			console.warn('用户token不存在，无法加载抽卡历史');
			return;
		}

		setIsLoadingHistory(true);		
		try {
			const historyData = await new Promise<any>((resolve, reject) => {
				new GetDrawHistoryMessage(userID).send(
					(response: any) => {
						if (response.error) {
							reject(new Error(response.error));
						} else {
							resolve(response);
						}
					}
				);			});

			// 尝试各种情况的解包
			let drawHistoryArray: DrawHistoryEntry[] = [];

			// 尝试解析为 JSON
			if (typeof historyData === 'string') {
				try {
					drawHistoryArray = JSON.parse(historyData);
				} catch (e) {
					console.warn('解析 historyData 字符串失败', e);
					drawHistoryArray = [];
				}
			}
			else if (Array.isArray(historyData)) {
				drawHistoryArray = historyData;
			}
			else if (Array.isArray((historyData as any).drawHistory)) {
				drawHistoryArray = (historyData as any).drawHistory;			}
			else {
				drawHistoryArray = [];
			}
			
			// 稀有度映射函数
			const mapRarityToNumber = (rarity: string): number => {
				switch (rarity) {
					case '传说': return 5;
					case '稀有': return 4;
					case '普通': return 3;
					default: return 3;
				}
			};
					// 将历史记录按卡池类型分组
			const groupedHistory = {
				featured: drawHistoryArray
					.filter(item => item.poolType === 'featured')
					.map(item => ({
						id: item.cardId,  // cardId 现在是 string
						name: item.cardName,
						rarity: mapRarityToNumber(item.rarity),
						time: new Date(item.drawTime).toLocaleString('zh-CN'),
						description: item.cardDescription,
						type: '限定祈愿'
					})),
				standard: drawHistoryArray
					.filter(item => item.poolType === 'standard')
					.map(item => ({
						id: item.cardId,  // cardId 现在是 string
						name: item.cardName,
						rarity: mapRarityToNumber(item.rarity),
						time: new Date(item.drawTime).toLocaleString('zh-CN'),
						description: item.cardDescription,
						type: '常驻祈愿'
					}))			};

			setWishHistory(groupedHistory);
		} catch (error) {
			console.error('加载抽卡历史失败:', error);
			// 使用模拟数据作为降级处理
			setWishHistory({
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
			});
		} finally {
			setIsLoadingHistory(false);
		}	};	// 组件加载时获取抽卡历史和抽卡次数
	useEffect(() => {
		if (userID) {
			loadDrawHistory();
			fetchAllCardDrawCounts();
		}
	}, [userID]);
	// 监听页面重新可见时刷新抽卡次数（从抽卡结果页返回时）
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (!document.hidden && userID) {
				// 页面重新可见时刷新抽卡次数
				fetchAllCardDrawCounts();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		
		// 组件焦点重新获得时也刷新（针对页面路由返回）
		const handleFocus = () => {
			if (userID) {
				fetchAllCardDrawCounts();
			}
		};
		
		window.addEventListener('focus', handleFocus);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('focus', handleFocus);
		};
	}, [userID]);

	const renderBannerSelector = () => (
		<div className="banner-selector">
			<h3>选择祈愿池</h3>
			<div className="banner-tabs">
				<button
					className={`banner-tab ${selectedBanner === 'featured' ? 'active' : ''}`}
					onClick={() => handleBannerSwitch('featured')}
				>
					<div className="tab-icon">🌟</div>
					<div className="tab-text">
						<div className="tab-title">限定祈愿</div>
						<div className="tab-subtitle">卡牌UP</div>
					</div>
				</button>
				<button
					className={`banner-tab ${selectedBanner === 'standard' ? 'active' : ''}`}
					onClick={() => handleBannerSwitch('standard')}
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
				</div>				<div className="pity-info">
					<div className="pity-label">距离保底还需:</div>
					<div className="pity-count">{Math.max(0, 90 - cardDrawCounts[selectedBanner])}次</div>
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
		};		const renderHistoryList = (records: any[], title: string) => (
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
								<div className="history-item-description">{record.description}</div>
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
							<span className="currency-amount">{user?.stoneAmount}</span>
						</div>
						<button className="history-btn" onClick={handleShowHistory}>
							📜 历史记录
						</button>
						<button className="wishpage-charge-btn" onClick={handleNavigateToShop}>
							📜 我想氪金
						</button>
						<button className="rules-btn" onClick={handleShowRules}>
							📋 祈愿规则
						</button>
					</div>
				</header>

				<main className="wish-main">
					{renderBannerSelector()}
					<div className="wish-content-container">
						<div className={`wish-content-wrapper ${animationClass}`}>
							<div className="wish-content">
								{renderCharacterShowcase()}
								{renderInfoPanel()}
							</div>
						</div>
					</div>
				</main>
			</div>
			{renderHistoryModal()}
			{renderRulesModal()}
		</PageTransition>
	);
};

export default WishPage;
