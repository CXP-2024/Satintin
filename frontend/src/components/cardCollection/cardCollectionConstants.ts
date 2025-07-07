import { CARD_IMAGE_MAP } from '../../utils/cardImageMap';
import { CardTypeInfo, RarityInfo } from './cardCollectionTypes';

// 卡牌类型和稀有度定义
export const CARD_TYPES: CardTypeInfo[] = [
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

export const RARITIES: RarityInfo[] = [
	{ name: '普通', color: '#95a5a6', stars: 3 },
	{ name: '稀有', color: '#3498db', stars: 4 },
	{ name: '传说', color: '#f39c12', stars: 5 }
];

// 具体卡牌数据（基于cards.md）- 保留作为图片映射参考
export const CARDS_DATA = [
	// 传说卡牌 (5星)
	{ id: 'template-dragon-nai', name: 'Dragon Nai', type: '反弹', rarity: '传说', image: CARD_IMAGE_MAP['template-dragon-nai'], owned: true },
	{ id: 'template-gaia', name: '盖亚', type: '穿透', rarity: '传说', image: CARD_IMAGE_MAP['template-gaia'], owned: false },
	{ id: 'template-go', name: 'Go', type: '发育', rarity: '传说', image: CARD_IMAGE_MAP['template-go'], owned: false },
	{ id: 'template-jie', name: '杰哥', type: '穿透', rarity: '传说', image: CARD_IMAGE_MAP['template-jie'], owned: true },

	// 稀有卡牌 (4星)
	{ id: 'template-paimon', name: 'Paimon', type: '反弹', rarity: '稀有', image: CARD_IMAGE_MAP['template-paimon'], owned: true },
	{ id: 'template-kun', name: '坤', type: '穿透', rarity: '稀有', image: CARD_IMAGE_MAP['template-kun'], owned: true },
	{ id: 'template-man', name: 'man', type: '发育', rarity: '稀有', image: CARD_IMAGE_MAP['template-man'], owned: false },

	// 普通卡牌 (3星)
	{ id: 'template-ice', name: '冰', type: '反弹', rarity: '普通', image: CARD_IMAGE_MAP['template-ice'], owned: true },
	{ id: 'template-wlm', name: 'wlm', type: '发育', rarity: '普通', image: CARD_IMAGE_MAP['template-wlm'], owned: true },
	// 穿透普通卡牌暂缺，用占位符
	{ id: 'placeholder', name: '？？？', type: '穿透', rarity: '普通', image: null, owned: false },
];
