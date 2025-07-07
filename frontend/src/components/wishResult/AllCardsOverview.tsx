import React from 'react';
import { WishResult } from '../../types/wishResult';
import { getCardImage } from '../../utils/cardImageMap';

interface AllCardsOverviewProps {
	cards: WishResult[];
	onBackToWish: () => void;
}

const AllCardsOverview: React.FC<AllCardsOverviewProps> = ({ cards, onBackToWish }) => {
	const getRarityClass = (rarity: number) => {
		switch (rarity) {
			case 5: return 'legendary';
			case 4: return 'epic';
			case 3: return 'rare';
			default: return 'common';
		}
	};

	const getRarityColor = (rarity: number) => {
		switch (rarity) {
			case 5: return '#FFD700'; // 金色
			case 4: return '#9932CC'; // 紫色
			case 3: return '#4169E1'; // 蓝色
			default: return '#808080'; // 灰色
		}
	};

	return (
		<div className="all-cards-container">
			<div className="all-cards-background">
				<div className="all-cards-header">
					<h2>十连祈愿结果</h2>
					<div className="summary-stats">
						<span className="stat">
							5星: {cards.filter(card => card.rarity === 5).length}
						</span>
						<span className="stat">
							4星: {cards.filter(card => card.rarity === 4).length}
						</span>
						<span className="stat">
							3星: {cards.filter(card => card.rarity === 3).length}
						</span>
					</div>
				</div>

				<div className="all-cards-grid">
					{cards.map((card, index) => (
						<div
							key={card.id}
							className={`mini-card ${getRarityClass(card.rarity)}`}
							style={{
								animationDelay: `${index * 0.1}s`
							}}
						>
							<div className="mini-card-glow" style={{ backgroundColor: getRarityColor(card.rarity) }} />
							<div className="mini-card-image">
								{getCardImage(card.image) ? (
									<img src={getCardImage(card.image)!} alt={card.name} className="mini-card-img" />
								) : (
									<span className="mini-card-emoji">{card.image}</span>
								)}
							</div>
							<div className="mini-card-info">
								<div className="mini-card-stars">
									{[...Array(card.rarity)].map((_, i) => (
										<span key={i} className="mini-star">⭐</span>
									))}
								</div>
								<h4 className="mini-card-name">{card.name}</h4>
							</div>
						</div>
					))}
				</div>

				<div className="all-cards-actions">
					<button className="back-to-wish-btn" onClick={onBackToWish}>
						返回祈愿
					</button>
				</div>
			</div>
		</div>
	);
};

export default AllCardsOverview;
