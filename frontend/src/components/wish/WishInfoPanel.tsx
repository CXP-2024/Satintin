import React from 'react';
import { BannerData } from '../../types/wish';
import primogemIcon from '../../assets/images/primogem-icon.png';

interface WishInfoPanelProps {
	banner: BannerData;
	selectedBanner: 'standard' | 'featured';
	cardDrawCount: number;
	onSingleWish: () => void;
	onTenWish: () => void;
}

const WishInfoPanel: React.FC<WishInfoPanelProps> = ({
	banner,
	selectedBanner,
	cardDrawCount,
	onSingleWish,
	onTenWish
}) => {
	return (
		<div className="wish-info-panel">
			{/* Banner详细信息 */}
			<div className="banner-details-card">
				<h3 className="banner-title">{banner.name}</h3>
				<p className="banner-description">{banner.description}</p>
				<div className="banner-stats">
					<div className="stat-item">
						<span className="stat-label">保底机制</span>
						<span className="stat-value">{banner.guaranteed}</span>
					</div>
					<div className="stat-item">
						<span className="stat-label">活动时间</span>
						<span className="stat-value">{banner.endTime}</span>
					</div>
				</div>
			</div>

			{/* 祈愿操作区域 */}
			<div className="wish-actions-card">
				<div className="wish-buttons">
					<div className="wish-option">
						<button className="wish-btn single" onClick={onSingleWish}>
							<div className="btn-content">
								<div className="btn-icon">✨</div>
								<div className="btn-title">单次祈愿</div>
								<div className="btn-cost">
									<img src={primogemIcon} alt="原石" className="cost-icon" />
									{banner.singleCost}
								</div>
							</div>
						</button>
					</div>

					<div className="wish-option">
						<button className="wish-btn ten" onClick={onTenWish}>
							<div className="btn-content">
								<div className="btn-icon">💫</div>
								<div className="btn-title">十连祈愿</div>
								<div className="btn-cost">
									<img src={primogemIcon} alt="原石" className="cost-icon" />
									{banner.tenCost}
								</div>
							</div>
						</button>
					</div>
				</div>
				<div className="pity-info">
					<div className="pity-label">距离保底还需:</div>
					<div className="pity-count">{Math.max(0, 90 - cardDrawCount)}次</div>
				</div>
			</div>
		</div>
	);
};

export default WishInfoPanel;
