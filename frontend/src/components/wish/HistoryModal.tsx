import React, { useState, useEffect } from 'react';
import { HistoryRecord, WishHistory } from '../../types/wish';
import { SoundUtils } from 'utils/soundUtils';

interface HistoryModalProps {
	isVisible: boolean;
	isClosing: boolean;
	wishHistory: WishHistory;
	onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
	isVisible,
	isClosing,
	wishHistory,
	onClose
}) => {	// 分页状态
	const [currentPage, setCurrentPage] = useState({ featured: 1, standard: 1 });
	const [itemsPerPage] = useState(6); // 每页显示6条记录，排成3*2网格
	// 当前选中的卡池
	const [selectedBanner, setSelectedBanner] = useState<'featured' | 'standard'>('featured');
	
	// 播放按钮点击音效
	const playClickSound = () => {
		SoundUtils.playClickSound(0.5);
	};

	// 当记录数量变化时重置页码
	useEffect(() => {
		const featuredTotalPages = Math.ceil(wishHistory.featured.length / itemsPerPage);
		const standardTotalPages = Math.ceil(wishHistory.standard.length / itemsPerPage);
		
		setCurrentPage(prev => ({
			featured: prev.featured > featuredTotalPages && featuredTotalPages > 0 ? featuredTotalPages : prev.featured,
			standard: prev.standard > standardTotalPages && standardTotalPages > 0 ? standardTotalPages : prev.standard
		}));
	}, [wishHistory.featured.length, wishHistory.standard.length, itemsPerPage]);

	if (!isVisible) return null;

	const getRarityColor = (rarity: number) => {
		switch (rarity) {
			case 5: return '#FFD700'; // 金色
			case 4: return '#9932CC'; // 紫色
			case 3: return '#4169E1'; // 蓝色
			default: return '#808080'; // 灰色
		}
	};	const renderHistoryList = (records: HistoryRecord[], bannerType: 'featured' | 'standard') => {
		const totalPages = Math.ceil(records.length / itemsPerPage);
		const currentPageNum = currentPage[bannerType];
		const startIndex = (currentPageNum - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		const currentRecords = records.slice(startIndex, endIndex);

		const handlePageChange = (pageNumber: number) => {
			playClickSound();
			setCurrentPage(prev => ({
				...prev,
				[bannerType]: pageNumber
			}));
		};
		return (
			<div className="history-single-column">
				{/* 添加 key 强制 React 在页码变化时重建列表 */}
				<div
					key={`${bannerType}-${currentPageNum}`}
					className="history-grid"
				>
					{currentRecords.length > 0 ? (						currentRecords.map(record => (
							<div key={record.id} className="history-grid-item">
								<div className="history-grid-item-header">
									<span
										className="history-grid-item-name"
										style={{ color: getRarityColor(record.rarity) }}
									>
										{record.name}
									</span>
								</div>
								<div className="history-grid-item-stars">
									{[...Array(record.rarity)].map((_, i) => (
										<span key={i} className="history-star">⭐</span>
									))}
								</div>
								<div className="history-grid-item-description">{record.description}</div>
								<div className="history-grid-item-time">{record.time}</div>
							</div>
						))
					) : (
						<div className="history-empty">暂无记录</div>
					)}
				</div>
				{totalPages > 1 && (
					<div className="history-pagination">
						<button
							className="history-pagination-btn"
							onClick={() => handlePageChange(currentPageNum - 1)}
							disabled={currentPageNum === 1}
						>
							上一页
						</button>
						{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
							<button
								key={page}
								className={`history-pagination-btn ${currentPageNum === page ? 'active' : ''}`}
								onClick={() => handlePageChange(page)}
							>
								{page}
							</button>
						))}
						<button
							className="history-pagination-btn"
							onClick={() => handlePageChange(currentPageNum + 1)}
							disabled={currentPageNum === totalPages}
						>
							下一页
						</button>
					</div>
				)}
			</div>
		);
	};

	const handleBannerSwitch = (banner: 'featured' | 'standard') => {
		if (banner !== selectedBanner) {
			playClickSound();
			setSelectedBanner(banner);
		}
	};

	return (
		<div className={`history-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={onClose}>
			<div className={`history-modal ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>				<div className="history-header">
					<h2>祈愿历史记录</h2>
					<button className="history-close-btn" onClick={onClose}>
						✕
					</button>
				</div>
				{/* 卡池切换区域 */}
				<div className="history-banner-selector">
					<div
						className={`history-banner-section ${selectedBanner === 'featured' ? 'active' : ''}`}
						onClick={() => handleBannerSwitch('featured')}
					>
						限定祈愿历史
					</div>
					<div
						className={`history-banner-section ${selectedBanner === 'standard' ? 'active' : ''}`}
						onClick={() => handleBannerSwitch('standard')}
					>
						常驻祈愿历史
					</div>
				</div>
				<div className="history-content">
					{selectedBanner === 'featured' && renderHistoryList(wishHistory.featured, 'featured')}
					{selectedBanner === 'standard' && renderHistoryList(wishHistory.standard, 'standard')}
				</div>
			</div>
		</div>
	);
};

export default HistoryModal;
