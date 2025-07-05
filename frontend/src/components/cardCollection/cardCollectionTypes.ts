// 扩展的卡牌数据接口，兼容前端展示需求
export interface ExtendedCardEntry {
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
export interface CardTemplate {
	cardID: string;
	cardName: string;
	rarity: string;
	description: string;
	cardType: string;
}

// 卡牌类型信息
export interface CardTypeInfo {
	type: string;
	desc: string;
	icon: string;
	effects: string[];
	color: string;
}

// 稀有度信息
export interface RarityInfo {
	name: string;
	color: string;
	stars: number;
}

// 标签页类型
export type TabType = 'deck' | 'all';

// 组件 Props 类型
export interface DeckManagerProps {
	userCards: ExtendedCardEntry[];
	selected: ExtendedCardEntry[];
	onSelectionChange: (cards: ExtendedCardEntry[]) => void;
	onConfirmDeck: () => void;
}

export interface AllCardsTabProps {
	allCardTemplates: CardTemplate[];
	userCards: ExtendedCardEntry[];
	selected: ExtendedCardEntry[];
	onSelect: (card: ExtendedCardEntry) => void;
	isLoading: boolean;
	isLoadingTemplates: boolean;
	error: string | null;
}

export interface CardSelectionAreaProps {
	uniqueCards: ExtendedCardEntry[];
	selected: ExtendedCardEntry[];
	userCards: ExtendedCardEntry[];
	onCardClick: (cardKey: string) => void;
	onCardRightClick: (cardKey: string, e: React.MouseEvent) => void;
	getCardKey: (card: ExtendedCardEntry) => string;
	getRemainingCount: (cardKey: string) => number;
	isCardDisabled: (cardKey: string) => boolean;
}

export interface SelectedDeckAreaProps {
	selected: ExtendedCardEntry[];
	onCardClick: (card: ExtendedCardEntry) => void;
	removingCard: string | null;
	rearranging: boolean;
}

export interface DeckActionsProps {
	onRecommend: () => void;
	onClear: () => void;
	onConfirm: () => void;
}
