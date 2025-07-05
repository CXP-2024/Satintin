import React from 'react';
import { BannerData } from '../../types/wish';

interface CharacterShowcaseProps {
	banner: BannerData;
	selectedBanner: 'standard' | 'featured';
}

const CharacterShowcase: React.FC<CharacterShowcaseProps> = ({ banner, selectedBanner }) => {
	return (
		<div className="character-showcase">
			<div className="featured-character-large">
				{typeof banner.image === 'string' && (banner.image.startsWith('/') || banner.image.includes('.')) ? (
					<img src={banner.image} alt={banner.subtitle} />
				) : (
					<div style={{ fontSize: '300px', textAlign: 'center' }}>{banner.image}</div>
				)}
			</div>
			<h2 className="character-name">{banner.subtitle}</h2>
			<p className="character-subtitle">{selectedBanner === 'featured' ? '限定UP' : '常驻卡牌'}</p>
		</div>
	);
};

export default CharacterShowcase;
