import React from 'react';
import { SoundUtils } from 'utils/soundUtils';

interface BannerSelectorProps {
	selectedBanner: 'standard' | 'featured';
	onBannerSwitch: (banner: 'standard' | 'featured') => void;
	isAnimating: boolean;
}

const BannerSelector: React.FC<BannerSelectorProps> = ({
	selectedBanner,
	onBannerSwitch,
	isAnimating
}) => {
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	const handleBannerSwitch = (newBanner: 'standard' | 'featured') => {
		if (newBanner === selectedBanner || isAnimating) return;
		playClickSound();
		onBannerSwitch(newBanner);
	};

	return (
		<div className="banner-selector">
			<h3>选择祈愿池</h3>
			<div className="banner-tabs">
				<button
					className={`banner-tab ${selectedBanner === 'featured' ? 'active' : ''}`}
					onClick={() => handleBannerSwitch('featured')}
				>
					<div className="tab-icon">🌟</div>
					<div className="tab-text">
						<div className="tab-title">限定祈愿</div>
						<div className="tab-subtitle">卡牌UP</div>
					</div>
				</button>
				<button
					className={`banner-tab ${selectedBanner === 'standard' ? 'active' : ''}`}
					onClick={() => handleBannerSwitch('standard')}
				>
					<div className="tab-icon">⭐</div>
					<div className="tab-text">
						<div className="tab-title">常驻祈愿</div>
						<div className="tab-subtitle">永久开放</div>
					</div>
				</button>
			</div>
		</div>
	);
};

export default BannerSelector;
