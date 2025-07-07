import React from 'react';
import './ActionSelector.css';
import { activeActions, passiveActions, specialDefenseActions } from 'utils/ActionConfig';
import { useActionSelectorHandles } from './ActionSelectorHandles';

const ActionSelector: React.FC = () => {
	const {
		// 状态
		currentPlayer,
		gameState,
		showActionSelector,
		actionSelectorExiting,
		selectedAction,
		selectedActiveActions,
		selectedObjectDefenseTarget,
		isActionSubmitted,

		// 处理函数
		isActionDisabled,
		getActionCount,
		canSubmit,
		handleSelectPassiveAction,
		handleSelectActiveAction,
		handleRemoveActiveAction,
		handleSelectObjectDefenseTarget,
		handleClearSelection,
		handleTemporaryHide,
		handleSubmitAction
	} = useActionSelectorHandles();

	// 如果组件不应该显示且没有在退出动画中，则不渲染
	if (!showActionSelector && !actionSelectorExiting) {
		return null;
	}

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
									selectedAction.defenseType === 'object_defense' &&
									selectedObjectDefenseTarget === action.type;

								return (
									<div
										key={action.type}
										className={`action-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isObjectDefenseTarget ? 'defense-target' : ''}`}
										onClick={() => {
											if (selectedAction?.actionCategory === 'passive' && selectedAction.defenseType === 'object_defense') {
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
								selectedAction.defenseType === action.type;
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
								{selectedAction.defenseType === 'object_defense' && (
									<span className="defense-info">
										防御目标: {selectedObjectDefenseTarget ?
											activeActions.find(a => a.type === selectedObjectDefenseTarget)?.name :
											'请选择'}
									</span>
								)}
								{selectedAction.defenseType === 'action_defense' && (
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
						{selectedAction?.actionCategory === 'passive' && selectedAction.defenseType === 'object_defense' && !selectedObjectDefenseTarget &&
							"请选择要防御的攻击类型"}
						{selectedAction?.actionCategory === 'passive' && selectedAction.defenseType === 'action_defense' && selectedActiveActions.length < 2 &&
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
