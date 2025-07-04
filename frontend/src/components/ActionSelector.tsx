import React from 'react';
import { useBattleStore } from '../store/battleStore';
import { webSocketService } from '../services/WebSocketService';
import { SoundUtils } from 'utils/soundUtils';
import './ActionSelector.css';
import { useUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";

const ActionSelector: React.FC = () => {
	const user = useUserInfo();
	const {
		currentPlayer,
		gameState,
		showActionSelector,
		actionSelectorExiting,
		selectedAction,
		isActionSubmitted,
		selectAction,
		submitAction,
		hideActionSelectorTemporarily
	} = useBattleStore();

	// 如果组件不应该显示且没有在退出动画中，则不渲染
	if (!showActionSelector && !actionSelectorExiting) {
		return null;
	}

	// 行动选项配置
	const actions = [
		{
			type: 'cake' as const,
			icon: '🍰',
			name: '饼',
			description: '+1能量\n若对方出撒，我方-1血',
			color: '#f39c12',
			requirements: '无消耗'
		},
		{
			type: 'defense' as const,
			icon: '🛡️',
			name: '防',
			description: '免疫撒攻击\n可能触发反弹效果',
			color: '#3498db',
			requirements: '无消耗'
		},
		{
			type: 'spray' as const,
			icon: '💧',
			name: '撒',
			description: '消耗1能量\n若对方出饼，对方-1血',
			color: '#e74c3c',
			requirements: '消耗1能量',
			disabled: (currentPlayer?.energy || 0) < 1
		}
	];

	// 选择行动
	const handleSelectAction = (actionType: 'cake' | 'defense' | 'spray') => {
		if (isActionSubmitted) return;

		const action = actions.find(a => a.type === actionType);
		if (action?.disabled) return;

		SoundUtils.playClickSound(0.5);
		selectAction(actionType);
	};

	// 暂时隐藏行动选择器
	const handleTemporaryHide = () => {
		SoundUtils.playClickSound(0.3);
		hideActionSelectorTemporarily();
	};

	// 提交行动
	const handleSubmitAction = () => {
		if (!selectedAction || !user || isActionSubmitted) return;

		SoundUtils.playClickSound(0.7);

		// 发送行动到服务器
		webSocketService.sendAction({
			type: selectedAction,
			playerId: user.userID
		});

		// 更新本地状态
		submitAction();
	};

	// 获取卡牌增强效果提示
	const getCardBonus = (actionType: string) => {
		if (!currentPlayer?.cards) return null;

		const relevantCards = currentPlayer.cards.filter(card => {
			switch (actionType) {
				case 'cake':
					return card.type === 'develop';
				case 'defense':
					return card.type === 'reflect';
				case 'spray':
					return card.type === 'penetrate';
				default:
					return false;
			}
		});

		if (relevantCards.length === 0) return null;

		const totalChance = relevantCards.reduce((sum, card) => sum + card.effectChance, 0);
		const cardNames = relevantCards.map(card => card.name).join('、');

		return {
			chance: Math.min(totalChance, 100), // 最大100%
			cards: cardNames
		};
	};

	return (
		<div className={`action-selector-overlay ${actionSelectorExiting ? 'exiting' : ''}`}>
			<div className={`action-selector ${actionSelectorExiting ? 'exiting' : ''}`}>
				<div className="action-selector-header">
					<div className="action-selector-header-left">
						<h3>选择你的行动</h3>
						{gameState?.roundPhase === 'action' && gameState.player1.remainingTime && (
							<div className="action-timer">
								<span className="timer-icon">⏰</span>
								<span className="timer-value">Player1: {gameState.player1.remainingTime}s</span>
								<span className="timer-value">Player2: {gameState.player2.remainingTime}s</span>
							</div>
						)}
					</div>
					<div className="action-selector-header-right">
						<div className="current-stats">
							<span className="stat">
								❤️ {currentPlayer?.health || 0}
							</span>
							<span className="stat">
								⚡ {currentPlayer?.energy || 0}
							</span>
						</div>
						<button
							className="temporary-hide-btn"
							onClick={handleTemporaryHide}
							title="暂时收起选择器，查看战况"
						>
							👁️ 查看战况
						</button>
					</div>
				</div>

				<div className="actions-grid">
					{actions.map((action) => {
						const isSelected = selectedAction === action.type;
						const isDisabled = action.disabled || isActionSubmitted;
						const cardBonus = getCardBonus(action.type);

						return (
							<div
								key={action.type}
								className={`action-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
								onClick={() => handleSelectAction(action.type)}
								style={{ borderColor: isSelected ? action.color : undefined }}
							>
								<div className="action-icon" style={{ color: action.color }}>
									{action.icon}
								</div>

								<div className="action-info">
									<h4 className="action-name">{action.name}</h4>
									<p className="action-description">{action.description}</p>
									<div className="action-requirements">
										{action.requirements}
									</div>
								</div>

								{cardBonus && (
									<div className="card-bonus">
										<div className="bonus-header">卡牌加成</div>
										<div className="bonus-effect">
											{cardBonus.chance}% 触发概率
										</div>
										<div className="bonus-cards">
											来自: {cardBonus.cards}
										</div>
									</div>
								)}

								{isSelected && (
									<div className="selected-indicator">
										✓ 已选择
									</div>
								)}

								{isDisabled && action.disabled && (
									<div className="disabled-overlay">
										能量不足
									</div>
								)}
							</div>
						);
					})}
				</div>

				<div className="action-selector-footer">
					<div className="action-hint">
						选择一个行动并确认提交，一旦提交无法更改
					</div>

					<div className="selector-actions">
						<button
							className={`submit-btn ${selectedAction ? 'active' : ''}`}
							onClick={handleSubmitAction}
							disabled={!selectedAction || isActionSubmitted}
						>
							{isActionSubmitted ? '已提交，等待对手...' : '确认提交'}
						</button>
					</div>
				</div>

				{isActionSubmitted && (
					<div className="submission-status">
						<div className="status-icon">⏳</div>
						<div className="status-text">行动已提交，等待对手选择...</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ActionSelector;
