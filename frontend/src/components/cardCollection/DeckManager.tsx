import React from 'react';
import { DeckManagerProps } from './cardCollectionTypes';
import { SoundUtils } from 'utils/soundUtils';
import { 
	getCardKey, 
	getRemainingCount, 
	isCardDisabled, 
	generateRecommendedDeck 
} from './cardCollectionUtils';
import SelectedDeckArea from './SelectedDeckArea';
import DeckActions from './DeckActions';
import CardSelectionArea from './CardSelectionArea';

const DeckManager: React.FC<DeckManagerProps> = ({
	userCards,
	selected,
	onSelectionChange,
	onConfirmDeck
}) => {
	const playClickSound = () => SoundUtils.playClickSound(0.5);

	// 处理卡牌选择
	const handleCardClick = (cardKey: string) => {
		playClickSound();
		
		// 如果已选择的卡牌数量达到3张，则不能再选择
		if (selected.length >= 3) return;
		
		// 找到该类型的卡牌
		const uniqueCards = getUniqueCards();
		const card = uniqueCards.find(c => getCardKey(c) === cardKey);
		if (!card) return;
		
		// 检查是否还有该类型的卡牌可用
		const selectedOfThisType = selected.filter(c => getCardKey(c) === cardKey).length;
		const totalOfThisType = userCards.filter(c => getCardKey(c) === cardKey).length;
		
		if (selectedOfThisType >= totalOfThisType) return;
		
		// 找到一个未被选择的该类型卡牌实例
		const availableCard = userCards.find(c => 
			getCardKey(c) === cardKey && 
			!selected.find(s => s.id === c.id)
		);
		
		if (availableCard) {
			onSelectionChange([...selected, availableCard]);
		}
	};

	const handleCardRightClick = (cardKey: string, e: React.MouseEvent) => {
		e.preventDefault();
		playClickSound();
		
		// 移除最后一个该类型的卡牌
		const lastCardIndex = selected.map(c => getCardKey(c)).lastIndexOf(cardKey);
		if (lastCardIndex !== -1) {
			const newSelected = [...selected];
			newSelected.splice(lastCardIndex, 1);
			onSelectionChange(newSelected);
		}
	};

	// 直接点击已选择卡牌移除
	const handleSelectedCardClick = (card: any) => {
		playClickSound();
		onSelectionChange(selected.filter(sel => sel.id !== card.id));
	};

	// 一键推荐
	const handleRecommend = () => {
		const recommendedDeck = generateRecommendedDeck(userCards);
		onSelectionChange(recommendedDeck);
	};

	// 清空卡组
	const handleClear = () => {
		onSelectionChange([]);
	};

	// 获取唯一卡牌
	const getUniqueCards = () => {
		const uniqueMap: Record<string, any> = {};
		userCards.forEach(card => {
			const cardKey = getCardKey(card);
			if (!uniqueMap[cardKey]) {
				uniqueMap[cardKey] = card;
			}
		});
		return Object.values(uniqueMap);
	};

	// 获取剩余数量的包装函数
	const getRemainingCountWrapper = (cardKey: string) => {
		return getRemainingCount(cardKey, userCards, selected);
	};

	// 检查卡牌是否禁用的包装函数
	const isCardDisabledWrapper = (cardKey: string) => {
		return isCardDisabled(cardKey, selected, userCards);
	};

	return (
		<div className="deck-section">
			<SelectedDeckArea 
				selected={selected}
				onCardClick={handleSelectedCardClick}
				removingCard={null}
				rearranging={false}
			/>
			
			<DeckActions 
				onRecommend={handleRecommend}
				onClear={handleClear}
				onConfirm={onConfirmDeck}
			/>
			
			<CardSelectionArea 
				uniqueCards={getUniqueCards()}
				selected={selected}
				userCards={userCards}
				onCardClick={handleCardClick}
				onCardRightClick={handleCardRightClick}
				getCardKey={getCardKey}
				getRemainingCount={getRemainingCountWrapper}
				isCardDisabled={isCardDisabledWrapper}
			/>
			
			<div className="deck-tip">
				* 左键点击选择卡牌，右键点击移除选择<br/>
				* 灰色卡牌表示数量不足或已达到3张上限<br/>
				* 每场对战只能携带三张卡牌，合理搭配提升胜率！
			</div>
		</div>
	);
};

export default DeckManager;
