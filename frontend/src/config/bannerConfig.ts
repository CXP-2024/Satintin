import { BannerData } from '../types/wish';
import nailongImage from '../assets/images/nailong.webp';
import jiegeImage from '../assets/images/jiege.png';

export const bannerConfig: Record<'featured' | 'standard', BannerData> = {
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
