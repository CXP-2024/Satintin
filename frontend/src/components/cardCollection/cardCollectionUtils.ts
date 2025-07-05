import { ExtendedCardEntry } from './cardCollectionTypes';
import { RARITIES, CARD_TYPES } from './cardCollectionConstants';

// 工具函数
export const getCardKey = (card: ExtendedCardEntry): string => {
	return `${card.cardID}_${card.rarityLevel}`;
};

export const getRarityInfo = (rarity: string) => {
	return RARITIES.find(r => r.name === rarity) || RARITIES[0];
};

export const getTypeInfo = (type: string) => {
	return CARD_TYPES.find(t => t.type === type) || CARD_TYPES[0];
};

// 计算剩余卡牌数量
export const getRemainingCount = (
	cardKey: string, 
	userCards: ExtendedCardEntry[], 
	selected: ExtendedCardEntry[]
): number => {
	const totalOfThisType = userCards.filter(c => getCardKey(c) === cardKey).length;
	const selectedOfThisType = selected.filter(c => getCardKey(c) === cardKey).length;
	return Math.max(0, totalOfThisType - selectedOfThisType);
};

// 检查卡牌是否被禁用
export const isCardDisabled = (
	cardKey: string, 
	selected: ExtendedCardEntry[], 
	userCards: ExtendedCardEntry[]
): boolean => {
	// 如果已选择3张卡牌，则禁用所有卡牌
	if (selected.length >= 3) return true;
	
	// 如果该类型卡牌没有剩余数量，则禁用
	return getRemainingCount(cardKey, userCards, selected) <= 0;
};

// 处理卡牌去重和计数
export const processUserCards = (userCards: ExtendedCardEntry[]) => {
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

	return {
		cardCounts: countMap,
		uniqueCards: Object.values(uniqueMap)
	};
};

// 一键推荐卡组
export const generateRecommendedDeck = (userCards: ExtendedCardEntry[]): ExtendedCardEntry[] => {
	const recommend: ExtendedCardEntry[] = [];
	const reversedRarities = [...RARITIES].reverse();
	
	for (const t of CARD_TYPES) {
		for (const r of reversedRarities) {
			const card = userCards.find(c => c.type === t.type && c.rarity === r.name && c.owned);
			if (card) {
				recommend.push(card);
				break;
			}
		}
	}
	
	return recommend;
};
