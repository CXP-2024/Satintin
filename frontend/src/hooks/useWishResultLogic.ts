import { useState, useEffect, useCallback } from 'react';
import { WishResult, DrawResultData, BackendCardEntry } from '../types/wishResult';
import danziVideo from '../assets/videos/danzi.mp4';
import danlanVideo from '../assets/videos/danlan.mp4';
import danjinVideo from '../assets/videos/danjin.mp4';
import shiziVideo from '../assets/videos/shizi.mp4';
import shijinVideo from '../assets/videos/shijin.mp4';

export const useWishResultLogic = () => {
	const [wishResults, setWishResults] = useState<WishResult[]>([]);
	const [wishType, setWishType] = useState<'single' | 'ten'>('single');
	const [bannerType, setBannerType] = useState<'featured' | 'standard'>('featured');
	const [selectedVideo, setSelectedVideo] = useState<string>(danziVideo);

	// 选择合适的抽卡动画视频
	const selectWishVideo = useCallback((results: WishResult[], isTenWish: boolean) => {
		if (isTenWish) {
			// 十连抽：检查是否有5星
			const hasFiveStar = results.some(card => card.rarity === 5);
			if (hasFiveStar) {
				return shijinVideo; // 十连出金色
			} else {
				return shiziVideo; // 十连出紫色（保底）
			}
		} else {
			// 单抽：根据唯一卡牌的稀有度选择
			const rarity = results[0]?.rarity || 3;
			switch (rarity) {
				case 5:
					return danjinVideo; // 单抽出金色
				case 4:
					return danziVideo; // 单抽出紫色
				case 3:
				default:
					return danlanVideo; // 单抽出蓝色
			}
		}
	}, []);

	// 映射后端数据到前端格式
	const mapBackendData = useCallback((cardList: BackendCardEntry[]) => {
		const rarityMap: Record<string, number> = { '传说': 5, '稀有': 4, '普通': 3 };
		
		return (cardList || []).map((card: BackendCardEntry, index: number) => ({
			id: `${card.cardID}-${index}`, // 使用 cardID + index 确保唯一性
			name: card.cardName,
			rarity: rarityMap[card.rarityLevel] || 3, // 使用 rarityLevel 而不是 rarity
			image: card.cardID, // 直接使用 cardID 作为图片标识
			type: 'character' as const
		}));
	}, []);

	// 从 localStorage 读取抽卡结果
	const loadDrawResults = useCallback(() => {
		const stored = localStorage.getItem('drawResult');
		console.log('Stored drawResult:', stored); // 调试日志

		if (stored) {
			const { cardList, isNewCard, type, banner }: DrawResultData = JSON.parse(stored);
			console.log('Parsed result:', { cardList, isNewCard, type, banner }); // 调试日志

			setWishType(type || 'single');
			setBannerType(banner || 'featured');

			const mapped = mapBackendData(cardList);
			console.log('Mapped results:', mapped); // 调试日志
			setWishResults(mapped);

			const video = selectWishVideo(mapped, type === 'ten');
			setSelectedVideo(video);
		}
	}, [mapBackendData, selectWishVideo]);

	// 组件初始化时加载数据
	useEffect(() => {
		loadDrawResults();
	}, [loadDrawResults]);

	return {
		wishResults,
		wishType,
		bannerType,
		selectedVideo,
		isTenWish: wishType === 'ten'
	};
};
