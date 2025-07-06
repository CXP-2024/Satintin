import React from 'react';
import { useBattleStore } from '../../store/battleStore';
import { webSocketService, AttackObjectName, BasicObjectName, PassiveAction, ActiveAction } from '../../services/WebSocketService';
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
		selectedActiveActions,
		selectedObjectDefenseTarget,
		isActionSubmitted,
		selectPassiveAction,
		selectActiveAction,
		removeActiveAction,
		selectObjectDefenseTarget,
		clearSelection,
		submitAction,
		hideActionSelectorTemporarily
	} = useBattleStore();

	// 如果组件不应该显示且没有在退出动画中，则不渲染
	if (!showActionSelector && !actionSelectorExiting) {
		return null;
	}

	// 简单被动行动配置
	const passiveActions = [
		{
			type: 'Cake' as BasicObjectName,
			icon: '🍰',
			name: '饼',
			description: '获得1能量',
			color: '#f39c12',
			requirements: '无消耗'
		},
		{
			type: 'Pouch' as BasicObjectName,
			icon: '💰',
			name: '袋',
			description: '不消耗能量，消耗所有能量',
			color: '#8e44ad',
			requirements: '消耗所有能量'
		},
		{
			type: 'BasicShield' as BasicObjectName,
			icon: '🛡️',
			name: '基础盾',
			description: '不消耗能量',
			color: '#3498db',
			requirements: '无消耗'
		},
		{
			type: 'BasicDefense' as BasicObjectName,
			icon: '🚧',
			name: '基础防',
			description: '消耗所有能量',
			color: '#95a5a6',
			requirements: '消耗所有能量'
		}
	];

	// 主动行动配置
	const activeActions = [
		{
			type: 'Sa' as AttackObjectName,
			icon: '💧',
			name: '撒',
			description: '攻击1[普通]，防御5',
			color: '#3498db',
			requirements: '消耗1能量',
			energyCost: 1
		},
		{
			type: 'Tin' as AttackObjectName,
			icon: '⚡',
			name: 'Tin',
			description: '攻击3[普通]，防御1',
			color: '#f1c40f',
			requirements: '消耗1能量',
			energyCost: 1
		},
		{
			type: 'NanMan' as AttackObjectName,
			icon: '🏹',
			name: '南蛮',
			description: '攻击3[穿透]，防御5',
			color: '#e74c3c',
			requirements: '消耗3能量',
			energyCost: 3
		},
		{
			type: 'DaShan' as AttackObjectName,
			icon: '⚔️',
			name: '大闪',
			description: '攻击4[穿透]，防御5',
			color: '#c0392b',
			requirements: '消耗4能量',
			energyCost: 4
		},
		{
			type: 'WanJian' as AttackObjectName,
			icon: '🗡️',
			name: '万剑',
			description: '攻击2[防弹]，防御5',
			color: '#8e44ad',
			requirements: '消耗3能量',
			energyCost: 3
		},
		{
			type: 'Nuclear' as AttackObjectName,
			icon: '☢️',
			name: '核爆',
			description: '攻击6[核爆]，防御6',
			color: '#27ae60',
			requirements: '消耗6能量',
			energyCost: 6
		}
	];

	// 特殊防御行动配置
	const specialDefenseActions = [
		{
			type: 'ObjectDefense' as BasicObjectName,
			icon: '🎯',
			name: '对象防御',
			description: '防御指定的一种攻击类型',
			color: '#16a085',
			requirements: '需选择防御目标'
		},
		{
			type: 'ActionDefense' as BasicObjectName,
			icon: '🌀',
			name: '行动防御',
			description: '防御多种攻击组合',
			color: '#2980b9',
			requirements: '需选择≥2个行动'
		}
	];

	// 检查行动是否被禁用
	const isActionDisabled = (actionType: 'passive' | 'active' | 'special') => {
		if (isActionSubmitted) return true;

		if (actionType === 'passive') {
			// 如果已选择其他类型，禁用简单被动行动
			return selectedAction?.actionCategory === 'active' ||
				(selectedAction?.actionCategory === 'passive' &&
					(selectedAction.defenseType === 'ObjectDefense' ||
						selectedAction.defenseType === 'ActionDefense'));
		}

		if (actionType === 'active') {
			// 如果已选择简单被动行动（非特殊防御），禁用主动行动
			return selectedAction?.actionCategory === 'passive' &&
				!selectedAction.defenseType;
		}

		if (actionType === 'special') {
			// 如果已选择其他类型，禁用特殊防御
			return selectedAction?.actionCategory === 'active' ||
				(selectedAction?.actionCategory === 'passive' &&
					!selectedAction.defenseType);
		}

		return false;
	};

	// 获取某个行动的选择次数
	const getActionCount = (actionType: AttackObjectName) => {
		return selectedActiveActions.filter(action => action === actionType).length;
	};

	// 检查是否可以提交
	const canSubmit = () => {
		if (!selectedAction || isActionSubmitted) return false;

		if (selectedAction.actionCategory === 'passive') {
			const passiveAction = selectedAction;

			// ObjectDefense必须选择目标
			if (passiveAction.defenseType === 'ObjectDefense') {
				return selectedObjectDefenseTarget !== null;
			}

			// ActionDefense必须选择至少2个行动
			if (passiveAction.defenseType === 'ActionDefense') {
				return selectedActiveActions.length >= 2;
			}

			// 简单被动行动可以直接提交
			return true;
		}

		// 主动行动必须有选择
		return selectedActiveActions.length > 0;
	};

	// 选择被动行动
	const handleSelectPassiveAction = (actionType: BasicObjectName) => {
		if (isActionDisabled('passive') || isActionSubmitted) return;

		SoundUtils.playClickSound(0.5);
		selectPassiveAction(actionType);
	};

	// 选择主动行动
	const handleSelectActiveAction = (actionType: AttackObjectName) => {
		if (isActionSubmitted) return;

		SoundUtils.playClickSound(0.5);
		selectActiveAction(actionType);
	};

	// 移除主动行动
	const handleRemoveActiveAction = (actionType: AttackObjectName) => {
		if (isActionSubmitted) return;

		SoundUtils.playClickSound(0.3);
		removeActiveAction(actionType);
	};

	// 选择ObjectDefense目标
	const handleSelectObjectDefenseTarget = (target: AttackObjectName) => {
		if (isActionSubmitted) return;

		SoundUtils.playClickSound(0.5);
		selectObjectDefenseTarget(target);
	};

	// 清除选择
	const handleClearSelection = () => {
		if (isActionSubmitted) return;

		SoundUtils.playClickSound(0.3);
		clearSelection();
	};

	// 暂时隐藏行动选择器
	const handleTemporaryHide = () => {
		SoundUtils.playClickSound(0.3);
		hideActionSelectorTemporarily();
	};

	// 提交行动
	const handleSubmitAction = () => {
		if (!canSubmit() || !user) return;

		SoundUtils.playClickSound(0.7);

		// 使用当前组件内的 state
		if (!selectedAction) return;

		let finalAction: PassiveAction | ActiveAction;

		// 构建最终行动（与 store 中的逻辑保持一致）
		if (selectedAction.actionCategory === 'passive') {
			const passiveAction = selectedAction as PassiveAction;

			// 构建最终的被动行动
			finalAction = {
				...passiveAction
			};

			if (passiveAction.defenseType === 'ObjectDefense' && selectedObjectDefenseTarget) {
				finalAction.targetObject = selectedObjectDefenseTarget;
			}

			if (passiveAction.defenseType === 'ActionDefense' && selectedActiveActions.length >= 2) {
				finalAction.targetAction = selectedActiveActions;
			}
		} else {
			finalAction = selectedAction as ActiveAction;
		}

		// 发送最终行动到服务器
		webSocketService.sendAction({
			type: finalAction,
			playerId: user.userID
		});

		// 更新本地状态
		submitAction();
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
							<span className="stat">❤️ {currentPlayer?.health || 0}</span>
							<span className="stat">⚡ {currentPlayer?.energy || 0}</span>
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

				<div className="action-content">
					{/* 左侧：简单被动行动 */}
					<div className="action-section passive-section">
						<h4 className="section-title">简单被动行动</h4>
						<div className="actions-grid">
							{passiveActions.map((action) => {
								const isSelected = selectedAction?.actionCategory === 'passive' &&
									selectedAction.objectName === action.type &&
									!selectedAction.defenseType;
								const isDisabled = isActionDisabled('passive');

								return (
									<div
										key={action.type}
										className={`action-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
										onClick={() => handleSelectPassiveAction(action.type)}
										style={{ borderColor: isSelected ? action.color : undefined }}
									>
										<div className="action-icon" style={{ color: action.color }}>
											{action.icon}
										</div>
										<div className="action-info">
											<h5 className="action-name">{action.name}</h5>
											<p className="action-description">{action.description}</p>
											<div className="action-requirements">{action.requirements}</div>
										</div>
										{isSelected && <div className="selected-indicator">✓</div>}
									</div>
								);
							})}
						</div>
					</div>

					{/* 右侧：主动行动 */}
					<div className="action-section active-section">
						<h4 className="section-title">主动行动</h4>
						<div className="actions-grid">
							{activeActions.map((action) => {
								const actionCount = getActionCount(action.type);
								const isSelected = actionCount > 0;
								const isDisabled = isActionDisabled('active');
								const isObjectDefenseTarget = selectedAction?.actionCategory === 'passive' &&
									selectedAction.defenseType === 'ObjectDefense' &&
									selectedObjectDefenseTarget === action.type;

								return (
									<div
										key={action.type}
										className={`action-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isObjectDefenseTarget ? 'defense-target' : ''}`}
										onClick={() => {
											if (selectedAction?.actionCategory === 'passive' && selectedAction.defenseType === 'ObjectDefense') {
												handleSelectObjectDefenseTarget(action.type);
											} else {
												handleSelectActiveAction(action.type);
											}
										}}
										style={{ borderColor: isSelected || isObjectDefenseTarget ? action.color : undefined }}
									>
										{/* 减号按钮 */}
										{actionCount > 0 && (
											<button
												className="remove-action-btn"
												onClick={(e) => {
													e.stopPropagation();
													handleRemoveActiveAction(action.type);
												}}
												title="减少此行动"
											>
												−
											</button>
										)}

										{/* 数量显示 */}
										{actionCount > 0 && (
											<div className="action-count">
												{actionCount}
											</div>
										)}

										<div className="action-icon" style={{ color: action.color }}>
											{action.icon}
										</div>
										<div className="action-info">
											<h5 className="action-name">{action.name}</h5>
											<p className="action-description">{action.description}</p>
											<div className="action-requirements">{action.requirements}</div>
										</div>
										{isSelected && <div className="selected-indicator">✓</div>}
										{isObjectDefenseTarget && <div className="defense-indicator">🎯</div>}
									</div>
								);
							})}
						</div>
					</div>
				</div>

				{/* 下方：特殊防御行动 */}
				<div className="action-section special-section">
					<h4 className="section-title">特殊防御行动</h4>
					<div className="actions-grid horizontal">
						{specialDefenseActions.map((action) => {
							const isSelected = selectedAction?.actionCategory === 'passive' &&
								selectedAction.defenseType === action.type.replace('Defense', 'Defense');
							const isDisabled = isActionDisabled('special');

							return (
								<div
									key={action.type}
									className={`action-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
									onClick={() => handleSelectPassiveAction(action.type)}
									style={{ borderColor: isSelected ? action.color : undefined }}
								>
									<div className="action-icon" style={{ color: action.color }}>
										{action.icon}
									</div>
									<div className="action-info">
										<h5 className="action-name">{action.name}</h5>
										<p className="action-description">{action.description}</p>
										<div className="action-requirements">{action.requirements}</div>
									</div>
									{isSelected && <div className="selected-indicator">✓</div>}
								</div>
							);
						})}
					</div>
				</div>

				{/* 状态显示区域 */}
				{selectedAction && (
					<div className="selection-status">
						<div className="status-header">当前选择：</div>
						{selectedAction.actionCategory === 'passive' ? (
							<div className="passive-status">
								<span className="action-type">被动行动: {
									passiveActions.find(a => a.type === selectedAction.objectName)?.name ||
									specialDefenseActions.find(a => a.type === selectedAction.objectName)?.name
								}</span>
								{selectedAction.defenseType === 'ObjectDefense' && (
									<span className="defense-info">
										防御目标: {selectedObjectDefenseTarget ?
											activeActions.find(a => a.type === selectedObjectDefenseTarget)?.name :
											'请选择'}
									</span>
								)}
								{selectedAction.defenseType === 'ActionDefense' && (
									<span className="defense-info">
										已选择行动: {selectedActiveActions.length > 0 ?
											selectedActiveActions.map(action =>
												activeActions.find(a => a.type === action)?.name
											).join(', ') : '无'} ({selectedActiveActions.length}/至少2个)
									</span>
								)}
							</div>
						) : (
							<div className="active-status">
								<span className="action-type">主动行动组合:</span>
								<span className="action-list">
									{selectedActiveActions.length > 0 ?
										selectedActiveActions.map(action =>
											activeActions.find(a => a.type === action)?.name
										).join(' + ') : '无'}
								</span>
							</div>
						)}
					</div>
				)}

				<div className="action-selector-footer">
					<div className="action-hint">
						{selectedAction?.actionCategory === 'passive' && selectedAction.defenseType === 'ObjectDefense' && !selectedObjectDefenseTarget &&
							"请选择要防御的攻击类型"}
						{selectedAction?.actionCategory === 'passive' && selectedAction.defenseType === 'ActionDefense' && selectedActiveActions.length < 2 &&
							"请选择至少2个行动进行防御"}
						{!selectedAction && "请选择一个行动"}
						{canSubmit() && "确认后无法更改，请仔细检查"}
					</div>

					<div className="selector-actions">
						<button
							className="clear-btn"
							onClick={handleClearSelection}
							disabled={!selectedAction || isActionSubmitted}
						>
							清除选择
						</button>
						<button
							className={`submit-btn ${canSubmit() ? 'active' : ''}`}
							onClick={handleSubmitAction}
							disabled={!canSubmit()}
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
