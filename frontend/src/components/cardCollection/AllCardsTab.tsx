import React from 'react';
import { AllCardsTabProps } from './cardCollectionTypes';
import { getRarityInfo, getTypeInfo } from './cardCollectionUtils';
import { RARITIES } from './cardCollectionConstants';
import { CARD_IMAGE_MAP } from '../../utils/cardImageMap';

const AllCardsTab: React.FC<AllCardsTabProps> = ({
	allCardTemplates,
	userCards,
	selected,
	onSelect,
	isLoading,
	isLoadingTemplates,
	error
}) => {
	return (
		<div className="all-cards-section">
			<h2>全部卡牌</h2>
			{(isLoading || isLoadingTemplates) && (
				<div className="loading-tip">正在加载卡牌数据...</div>
			)}
			{error && <div className="error-tip">{error}</div>}
			{!isLoading && !isLoadingTemplates && !error && (
				<>
					<div className="all-cards-grid">
						{allCardTemplates.map((template) => {
							const rarityInfo = getRarityInfo(template.rarity);
							const typeInfo = getTypeInfo(template.description);
							const effectIndex = RARITIES.findIndex(r => r.name === template.rarity);
							
							// 检查用户是否拥有这种卡牌
							const userOwnedCards = userCards.filter(card => card.cardID === template.cardID);
							const isOwned = userOwnedCards.length > 0;
							const ownedCount = userOwnedCards.length;
							
							// 检查是否有选中的卡牌
							const selectedCards = selected.filter(sel => sel.cardID === template.cardID);
							const isSelected = selectedCards.length > 0;
							
							return (
								<div 
									key={template.cardID}
									className={`all-card ${isOwned ? 'owned' : 'not-owned'} ${template.description} ${isSelected ? 'selected' : ''}`}
									onClick={isOwned ? () => {
										// 如果拥有该卡牌，可以选择第一张未选中的
										const availableCard = userOwnedCards.find(card => 
											!selected.find(sel => sel.id === card.id)
										);
										if (availableCard && selected.length < 3) {
											onSelect(availableCard);
										}
									} : undefined}
									style={{ cursor: isOwned ? 'pointer' : 'not-allowed' }}
								>
									<div className="card-image">
										{CARD_IMAGE_MAP[template.cardID] ? (
											<img src={CARD_IMAGE_MAP[template.cardID]} alt={template.cardName} />
										) : (
											<div className="placeholder-image">？</div>
										)}
									</div>
									<div className="card-info">
										<div className="card-name">{template.cardName}</div>
										<div className="card-type" style={{ color: typeInfo.color }}>
											{typeInfo.icon} {template.description}
										</div>
										<div className="card-rarity" style={{ color: rarityInfo.color }}>
											{'★'.repeat(rarityInfo.stars)} {template.rarity}
										</div>
										<div className="card-effect">{typeInfo.effects[effectIndex]}</div>
									</div>
									{!isOwned && <div className="not-owned-overlay">未拥有</div>}
									{isOwned && ownedCount > 1 && <div className="owned-count-overlay">x{ownedCount}</div>}
									{isSelected && <div className="selected-overlay">已选择</div>}
								</div>
							);
						})}
					</div>
					<div className="all-cards-tip">
						* 只有已拥有的卡牌才能加入卡组 * 灰色卡牌表示未拥有
					</div>
				</>
			)}
		</div>
	);
};

export default AllCardsTab;
