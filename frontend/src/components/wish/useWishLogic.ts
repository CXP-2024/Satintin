import { useState, useCallback } from 'react';
import { DrawCardMessage } from 'Plugins/CardService/APIs/DrawCardMessage';
import { QueryAssetStatusMessage } from 'Plugins/AssetService/APIs/QueryAssetStatusMessage';
import { QueryCardDrawCountMessage } from 'Plugins/AssetService/APIs/QueryCardDrawCountMessage';
import { GetDrawHistoryMessage, DrawHistoryEntry } from 'Plugins/CardService/APIs/GetDrawHistoryMessage';
import { setUserInfoField } from 'Plugins/CommonUtils/Store/UserInfoStore';
import { WishHistory, CardDrawCounts } from '../../types/wish';

export const useWishLogic = (userID: string | undefined) => {
	const [wishHistory, setWishHistory] = useState<WishHistory>({
		featured: [],
		standard: []
	});
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [cardDrawCounts, setCardDrawCounts] = useState<CardDrawCounts>({
		standard: 0,
		featured: 0
	});
	// 刷新用户资产状态
	const refreshUserAssets = useCallback(async () => {
		if (!userID) return;
		
		try {
			const response: any = await new Promise((resolve, reject) => {
				new QueryAssetStatusMessage(userID).send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});

			const stoneAmount: number = +response;
			setUserInfoField('stoneAmount', stoneAmount);
		} catch (err) {
			console.error('刷新用户资产失败:', err);
		}
	}, [userID]);

	// 获取用户指定卡池的当前抽卡次数
	const fetchCardDrawCount = useCallback(async (poolType: 'standard' | 'featured') => {
		if (!userID) return;

		try {
			const response: any = await new Promise((resolve, reject) => {
				new QueryCardDrawCountMessage(userID, poolType).send(
					(res: any) => resolve(res),
					(err: any) => reject(err)
				);
			});

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
	}, [userID]);

	// 获取所有卡池的抽卡次数
	const fetchAllCardDrawCounts = useCallback(async () => {
		if (!userID) return;

		await Promise.all([
			fetchCardDrawCount('standard'),
			fetchCardDrawCount('featured')
		]);
	}, [userID, fetchCardDrawCount]);
	// 加载抽卡历史记录
	const loadDrawHistory = useCallback(async () => {
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
				);
			});

			// 尝试各种情况的解包
			let drawHistoryArray: DrawHistoryEntry[] = [];
			console.log('98');
			try {
				drawHistoryArray = JSON.parse(historyData);
			} catch (e) {
				console.warn('解析 historyData 字符串失败', e);
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
						id: item.cardId,
						name: item.cardName,
						rarity: mapRarityToNumber(item.rarity),
						time: new Date(item.drawTime).toLocaleString('zh-CN'),
						description: item.cardDescription,
						type: '限定祈愿'
					})),
				standard: drawHistoryArray
					.filter(item => item.poolType === 'standard')
					.map(item => ({
						id: item.cardId,
						name: item.cardName,
						rarity: mapRarityToNumber(item.rarity),
						time: new Date(item.drawTime).toLocaleString('zh-CN'),
						description: item.cardDescription,
						type: '常驻祈愿'
					}))
			};

			setWishHistory(groupedHistory);
		} catch (error) {
			console.error('加载抽卡历史失败:', error);
		} finally {
			setIsLoadingHistory(false);
		}
	}, [userID]);
	// 执行抽卡
	const performDraw = async (
		selectedBanner: 'standard' | 'featured',
		drawCount: number,
		onSuccess: (resultData: any) => void,
		onError: (error: string) => void
	) => {
		try {
			const drawResult = await new Promise<string>((resolve, reject) => {
				new DrawCardMessage(userID, drawCount, selectedBanner).send(
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

			// 解析响应数据
			let parsedResult: any;
			try {
				parsedResult = JSON.parse(drawResult);
			} catch (e) {
				console.error('解析抽卡结果失败:', e);
				parsedResult = { cardList: [], isNewCard: false };
			}
			const cardList = parsedResult.cardList || [];
			const isNewCard = parsedResult.isNewCard || false;

			// 更新抽卡次数
			setCardDrawCounts(prev => ({
				...prev,
				[selectedBanner]: prev[selectedBanner] + drawCount
			}));

			// 刷新用户资产状态
			await refreshUserAssets();

			// 传递抽卡结果 - 不再调用 loadDrawHistory 和 fetchCardDrawCount 避免死循环
			const resultData = {
				cardList: cardList,
				isNewCard: isNewCard,
				type: drawCount === 1 ? 'single' : 'ten',
				banner: selectedBanner
			};

			onSuccess(resultData);
		} catch (error) {
			console.error('抽卡失败:', error);
			onError('抽卡失败，请重试！');
		}
	};	// 抽卡成功后刷新数据
	const refreshDataAfterDraw = useCallback(async () => {
		if (!userID) return;
		
		// 刷新抽卡历史和抽卡次数
		await Promise.all([
			loadDrawHistory(),
			fetchAllCardDrawCounts()
		]);
	}, [userID, loadDrawHistory, fetchAllCardDrawCounts]);

	// 单次抽卡
	const handleSingleWish = async (
		selectedBanner: 'standard' | 'featured',
		bannerConfig: any,
		navigateQuick: (path: string) => void
	) => {
		try {
			const resultData = await new Promise<any>((resolve, reject) => {
				performDraw(selectedBanner, 1, resolve, reject);
			});

			localStorage.setItem('drawResult', JSON.stringify(resultData));
			
			// 抽卡成功后刷新数据
			await refreshDataAfterDraw();
			
			navigateQuick('/wish-result');
		} catch (error) {
			alert(error);
		}
	};

	// 十连抽卡
	const handleTenWish = async (
		selectedBanner: 'standard' | 'featured',
		bannerConfig: any,
		navigateQuick: (path: string) => void
	) => {
		try {
			const resultData = await new Promise<any>((resolve, reject) => {
				performDraw(selectedBanner, 10, resolve, reject);
			});

			localStorage.setItem('drawResult', JSON.stringify(resultData));
			
			// 抽卡成功后刷新数据
			await refreshDataAfterDraw();
			
			navigateQuick('/wish-result');
		} catch (error) {
			alert(error);
		}
	};

	return {
		wishHistory,
		isLoadingHistory,
		cardDrawCounts,
		refreshUserAssets,
		loadDrawHistory,
		fetchAllCardDrawCounts,
		fetchCardDrawCount,
		handleSingleWish,
		handleTenWish
	};
};
