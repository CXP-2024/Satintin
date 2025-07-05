import React from 'react';
import { HistoryRecord, WishHistory } from '../../types/wish';

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
}) => {
	if (!isVisible) return null;

	const getRarityColor = (rarity: number) => {
		switch (rarity) {
			case 5: return '#FFD700'; // 金色
			case 4: return '#9932CC'; // 紫色
			case 3: return '#4169E1'; // 蓝色
			default: return '#808080'; // 灰色
		}
	};

	const renderHistoryList = (records: HistoryRecord[], title: string) => (
		<div className="history-column">
			<h3>{title}</h3>
			<div className="history-list">
				{records.length > 0 ? (
					records.map((record) => (
						<div key={record.id} className="history-item">
							<div className="history-item-main">
								<span
									className="history-item-name"
									style={{ color: getRarityColor(record.rarity) }}
								>
									{record.name}
								</span>
								<div className="history-item-stars">
									{[...Array(record.rarity)].map((_, i) => (
										<span key={i} className="history-star">⭐</span>
									))}
								</div>
							</div>
							<div className="history-item-description">{record.description}</div>
							<div className="history-item-time">{record.time}</div>
						</div>
					))
				) : (
					<div className="history-empty">暂无记录</div>
				)}
			</div>
		</div>
	);

	return (
		<div className={`history-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={onClose}>
			<div className={`history-modal ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
				<div className="history-header">
					<h2>祈愿历史记录</h2>
					<button className="history-close-btn" onClick={onClose}>
						✕
					</button>
				</div>
				<div className="history-content">
					{renderHistoryList(wishHistory.featured, '限定祈愿历史')}
					{renderHistoryList(wishHistory.standard, '常驻祈愿历史')}
				</div>
			</div>
		</div>
	);
};

export default HistoryModal;
