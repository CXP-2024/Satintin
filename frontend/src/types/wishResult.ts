// 祈愿结果相关的类型定义
export interface WishResult {
	id: string;
	name: string;
	rarity: number;
	image: string;
	type: 'character' | 'weapon';
}

export interface BackendCardEntry {
	cardID: string;
	cardName: string;
	rarityLevel: string;
}

export interface DrawResultData {
	cardList: BackendCardEntry[];
	isNewCard: boolean;
	type: 'single' | 'ten';
	banner: 'featured' | 'standard';
}
