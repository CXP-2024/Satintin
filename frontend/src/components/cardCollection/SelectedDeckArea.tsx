import React from 'react';
import { SelectedDeckAreaProps } from './cardCollectionTypes';
import { getRarityInfo, getTypeInfo } from './cardCollectionUtils';
import { RARITIES } from './cardCollectionConstants';

const SelectedDeckArea: React.FC<SelectedDeckAreaProps> = ({
	selected,
	onCardClick,
	removingCard,
	rearranging
}) => {
	return (
		<div className="selected-deck-area">
			<h2>已选卡组（{selected.length}/3）</h2>
			<div className="deck-cards">
				{selected.length === 0 && (
					<div className="empty-tip">请从下方选择三张卡牌组成卡组</div>
				)}
				{selected.map((card, idx) => {
					const rarityInfo = getRarityInfo(card.rarity);
					const typeInfo = getTypeInfo(card.type);
					const effectIndex = RARITIES.findIndex(r => r.name === card.rarity);

					return (
						<div 
							key={card.id} 
							className={`deck-card owned ${card.type} ${removingCard === card.id ? 'removing' : ''} ${rearranging ? 'rearranging' : ''}`}
							onClick={() => onCardClick(card)}
							style={{ cursor: 'pointer' }}
							title="点击移除此卡牌"
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
							<div className="click-to-remove-hint">点击移除</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default SelectedDeckArea;
