import React from 'react';

interface RulesModalProps {
	isVisible: boolean;
	isClosing: boolean;
	onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({
	isVisible,
	isClosing,
	onClose
}) => {
	if (!isVisible) return null;

	return (
		<div className={`rules-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={onClose}>
			<div className={`rules-modal ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
				<div className="rules-header">
					<h2>祈愿规则说明</h2>
					<button className="rules-close-btn" onClick={onClose}>
						✕
					</button>
				</div>
				<div className="rules-content">
					<div className="rules-section">
						<h3>🌟 限定祈愿池</h3>
						<div className="rules-details">
							<h4>卡池特色：</h4>
							<ul>
								<li>限时开放，活动期间概率UP</li>
								<li>包含当期限定5星卡牌</li>
								<li>首次5星保底机制</li>
							</ul>

							<h4>抽卡概率：</h4>
							<div className="probability-table">
								<div className="prob-row">
									<span className="prob-rarity legendary">5星卡牌</span>
									<span className="prob-rate">0.6%</span>
									<span className="prob-detail">90抽内必出</span>
								</div>
								<div className="prob-row">
									<span className="prob-rarity epic">4星卡牌</span>
									<span className="prob-rate">5.5%</span>
									<span className="prob-detail">10抽内必出</span>
								</div>
								<div className="prob-row">
									<span className="prob-rarity rare">3星卡牌</span>
									<span className="prob-rate">93.9%</span>
									<span className="prob-detail">基础概率</span>
								</div>
							</div>

							<h4>保底机制：</h4>
							<ul>
								<li><strong>硬保底：</strong>90抽内必出5星卡牌</li>
								<li><strong>软保底：</strong>从第74抽开始，5星概率逐步提升</li>
								<li><strong>十连保底：</strong>十连抽必出至少1个4星或以上</li>
								<li><strong>UP保底：</strong>首次获得5星卡牌有50%概率为UP卡牌，如非UP卡牌，下次5星必为UP卡牌</li>
							</ul>
						</div>
					</div>

					<div className="rules-section">
						<h3>⭐ 常驻祈愿池</h3>
						<div className="rules-details">
							<h4>卡池特色：</h4>
							<ul>
								<li>永久开放，无时间限制</li>
								<li>包含所有基础卡牌</li>
								<li>稳定的获取渠道</li>
							</ul>

							<h4>抽卡概率：</h4>
							<div className="probability-table">
								<div className="prob-row">
									<span className="prob-rarity legendary">5星卡牌</span>
									<span className="prob-rate">0.6%</span>
									<span className="prob-detail">90抽内必出</span>
								</div>
								<div className="prob-row">
									<span className="prob-rarity epic">4星卡牌</span>
									<span className="prob-rate">5.5%</span>
									<span className="prob-detail">10抽内必出</span>
								</div>
								<div className="prob-row">
									<span className="prob-rarity rare">3星卡牌</span>
									<span className="prob-rate">93.9%</span>
									<span className="prob-detail">基础概率</span>
								</div>
							</div>

							<h4>保底机制：</h4>
							<ul>
								<li><strong>硬保底：</strong>90抽内必出5星卡牌</li>
								<li><strong>软保底：</strong>从第74抽开始，5星概率逐步提升</li>
								<li><strong>十连保底：</strong>十连抽必出至少1个4星或以上</li>
								<li><strong>随机5星：</strong>所有5星卡牌均等概率获得</li>
							</ul>
						</div>
					</div>

					<div className="rules-section">
						<h3>💎 消耗与建议</h3>
						<div className="rules-details">
							<h4>原石消耗：</h4>
							<ul>
								<li><strong>单次祈愿：</strong>160原石</li>
								<li><strong>十连祈愿：</strong>1600原石</li>
							</ul>

							<h4>祈愿建议：</h4>
							<ul>
								<li>推荐使用十连祈愿，享受十连保底</li>
								<li>限定卡池适合追求特定卡牌的玩家</li>
								<li>常驻卡池适合新手快速获得基础卡牌</li>
								<li>理性祈愿，量力而行</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RulesModal;
