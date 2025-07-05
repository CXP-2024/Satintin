// 祈愿相关的类型定义
export interface BannerData {
	name: string;
	subtitle: string;
	image: string;
	description: string;
	guaranteed: string;
	singleCost: number;
	tenCost: number;
	endTime: string;
}

export interface HistoryRecord {
	id: number | string;
	name: string;
	rarity: number;
	time: string;
	description?: string;
	type: string;
}

export interface WishHistory {
	featured: HistoryRecord[];
	standard: HistoryRecord[];
}

export interface CardDrawCounts {
	standard: number;
	featured: number;
}

export interface DrawResult {
	cardList: any[];
	isNewCard: boolean;
	type: 'single' | 'ten';
	banner: 'standard' | 'featured';
}
