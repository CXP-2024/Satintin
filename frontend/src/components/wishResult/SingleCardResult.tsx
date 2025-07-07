import React from 'react';
import { WishResult } from '../../types/wishResult';
import { getCardImage } from '../../utils/cardImageMap';

interface SingleCardResultProps {
	card: WishResult;
	currentIndex: number;
	totalCount: number;
	isTenWish: boolean;
	onContinue: () => void;
	onSkipToAll?: () => void;
}

const SingleCardResult: React.FC<SingleCardResultProps> = ({
	card,
	currentIndex,
	totalCount,
	isTenWish,
	onContinue,
	onSkipToAll
}) => {
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
		<div className="result-container">
			<div className="result-background">
				{/* 进度指示器 - 仅十连抽显示 */}
				{isTenWish && (
					<div className="progress-indicator">
						<span className="progress-text">
							{currentIndex + 1} / {totalCount}
						</span>
						<div className="progress-bar">
							<div
								className="progress-fill"
								style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
							/>
						</div>
					</div>
				)}

				<div className="sparkle-effects">
					{[...Array(12)].map((_, i) => (
						<div
							key={i}
							className="sparkle"
							style={{
								'--delay': `${i * 0.2}s`,
								'--angle': `${i * 30}deg`,
							} as React.CSSProperties}
						/>
					))}
				</div>

				<div className={`card-result ${getRarityClass(card.rarity)}`}>
					<div className="card-glow" style={{ backgroundColor: getRarityColor(card.rarity) }} />
					<div className="card-container">
						<div className="card-image">
							{getCardImage(card.image) ? (
								<img src={getCardImage(card.image)!} alt={card.name} className="card-img" />
							) : (
								<span className="card-emoji">{card.image}</span>
							)}
						</div>

						<div className="card-info">
							<div className="card-stars">
								{[...Array(card.rarity)].map((_, i) => (
									<span key={i} className="star">⭐</span>
								))}
							</div>
							<h2 className="card-name">{card.name}</h2>
							<p className="card-type">
								{card.rarity}星 {card.type === 'character' ? '卡牌' : '武器'}
							</p>
						</div>
					</div>

					<div className="result-actions">
						<button className="continue-btn" onClick={onContinue}>
							{isTenWish
								? (currentIndex < totalCount - 1 ? '下一张' : '查看全部')
								: '谢谢你'
							}
						</button>
						{/* 十连抽时显示跳过按钮 */}
						{isTenWish && currentIndex < totalCount - 1 && onSkipToAll && (
							<button className="skip-to-all-btn" onClick={onSkipToAll}>
								跳过
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default SingleCardResult;
