import React from 'react';
import { CardSelectionAreaProps } from './cardCollectionTypes';
import { getRarityInfo, getTypeInfo } from './cardCollectionUtils';
import { RARITIES } from './cardCollectionConstants';

const CardSelectionArea: React.FC<CardSelectionAreaProps> = ({
	uniqueCards,
	selected,
	userCards,
	onCardClick,
	onCardRightClick,
	getCardKey,
	getRemainingCount,
	isCardDisabled
}) => {
	return (
		<div className="card-selection-area">
			<h3>选择卡牌</h3>
			<div className="selection-cards-grid">
				{uniqueCards.map(card => {
					const cardKey = getCardKey(card);
					const rarityInfo = getRarityInfo(card.rarity);
					const typeInfo = getTypeInfo(card.type);
					const effectIndex = RARITIES.findIndex(r => r.name === card.rarity);
					const remainingCount = getRemainingCount(cardKey);
					const disabled = isCardDisabled(cardKey);
					
					return (
						<div 
							key={cardKey} 
							className={`selection-card ${disabled ? 'disabled' : 'owned'} ${card.type}`}
							onClick={() => onCardClick(cardKey)}
							onContextMenu={(e) => onCardRightClick(cardKey, e)}
						>
							<div className="card-image">
								{card.image ? (
									<img src={card.image} alt={card.name} />
								) : (
									<div className="placeholder-image">？</div>
								)}
							</div>
							<div className="card-info">
								<div className="card-name">{card.name}</div>
								<div className="card-type" style={{ color: typeInfo.color }}>
									{typeInfo.icon} {card.type}
								</div>
								<div className="card-rarity" style={{ color: rarityInfo.color }}>
									{'★'.repeat(rarityInfo.stars)} {card.rarity}
								</div>
								<div className="card-effect">{typeInfo.effects[effectIndex]}</div>
							</div>
							<div className="card-remaining-count">剩余: {remainingCount}</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default CardSelectionArea;
