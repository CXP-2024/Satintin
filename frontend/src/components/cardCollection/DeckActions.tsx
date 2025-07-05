import React from 'react';
import { DeckActionsProps } from './cardCollectionTypes';
import { SoundUtils } from 'utils/soundUtils';

const DeckActions: React.FC<DeckActionsProps> = ({
	onRecommend,
	onClear,
	onConfirm
}) => {
	const playClickSound = () => SoundUtils.playClickSound(0.5);

	const handleRecommend = () => {
		playClickSound();
		onRecommend();
	};

	const handleClear = () => {
		playClickSound();
		onClear();
	};

	const handleConfirm = () => {
		playClickSound();
		onConfirm();
	};

	return (
		<div className="deck-actions">
			<button className="deck-btn recommend" onClick={handleRecommend}>
				一键推荐
			</button>
			<button className="deck-btn clear" onClick={handleClear}>
				清空卡组
			</button>
			<button className="deck-btn confirm" onClick={handleConfirm}>
				确定
			</button>
		</div>
	);
};

export default DeckActions;
