import React, { useEffect, useState } from 'react';
import { RoundResult } from '../../services/WebSocketService';
import { useBattleStore } from '../../store/battleStore';
import { SoundUtils } from 'utils/soundUtils';
import './RoundResultModal.css';
import { getBattleOutcome, getActionDisplay, getPlayerData } from './RoundResultModalUtils';

interface RoundResultModalProps {
	result: RoundResult;
	onClose: () => void;
	onHideTemporarily?: () => void; // 新增：暂时隐藏回调
	onDirectExit?: () => void; // 新增：直接退出回调（跳过GameOverModal）
	isGameOver?: boolean; // 新增：标记游戏是否已结束
}

const RoundResultModal: React.FC<RoundResultModalProps> = ({ result, onClose, onHideTemporarily, onDirectExit, isGameOver }) => {
	const { currentPlayer, opponent, roundResultExiting, lastRoundSelectedAction } = useBattleStore();
	const [animationPhase, setAnimationPhase] = useState<'actions' | 'effects' | 'results'>('actions');
	const [showEffects, setShowEffects] = useState(false);
	console.log('RoundResultModal rendered with result:', result);

	// 计算玩家数据和战斗结果
	const playerData = getPlayerData(currentPlayer, opponent, result);
	const battleOutcome = getBattleOutcome(currentPlayer, opponent, result);

	// 动画序列
	useEffect(() => {
		setAnimationPhase('effects');
		setShowEffects(true);
		setAnimationPhase('results');
	}, []);



	// 关闭模态框
	const handleClose = () => {
		SoundUtils.playClickSound(0.5);
		onClose();
	};

	// 直接退出战斗（跳过GameOverModal）
	const handleDirectExit = () => {
		SoundUtils.playClickSound(0.5);
		if (onDirectExit) {
			onDirectExit();
		}
	};

	// 暂时隐藏模态框
	const handleHideTemporarily = () => {
		SoundUtils.playClickSound(0.5);
		if (onHideTemporarily) {
			onHideTemporarily();
		}
	};

	return (
		<div className={`round-result-overlay ${roundResultExiting ? 'exiting' : ''}`}>
			<div className={`round-result-modal ${roundResultExiting ? 'exiting' : ''}`}>
				<div className="modal-header">
					<h2>第 {result.round} 回合结果</h2>
					{onHideTemporarily && (
						<button
							className="hide-temporarily-btn"
							onClick={handleHideTemporarily}
							title="暂时隐藏"
						>
							📤
						</button>
					)}
				</div>

				<div className="modal-content">
					{/* 行动展示 */}
					<div className={`actions-section ${animationPhase}`}>
						<div className="player-action current-player">
							<div className="player-name">{playerData.current.name}</div>
							<div className="action-display">
								<span
									className="action-icon"
									style={{ color: getActionDisplay(lastRoundSelectedAction).color }}
								>
									{getActionDisplay(lastRoundSelectedAction).icon}
								</span>
								<span className="action-text">
									{getActionDisplay(lastRoundSelectedAction).text}
								</span>
							</div>
						</div>

						<div className="vs-indicator">VS</div>

						<div className="player-action opponent-player">
							<div className="player-name">{playerData.opponent.name}</div>
							<div className="action-display">
								<span
									className="action-icon"
									style={{ color: '#95a5a6' }}
								>
									{'❓'}
								</span>
								<span className="action-text">
									{'神之一手'}
								</span>
							</div>
						</div>
					</div>

					{/* 战斗结果 */}
					{animationPhase !== 'actions' && (
						<div className="battle-outcome">
							<div className={`outcome-message ${battleOutcome.type}`}>
								{battleOutcome.message}
							</div>
						</div>
					)}

					{/* 卡牌效果 */}
					{showEffects && result.cardEffects.length > 0 && (
						<div className="card-effects-section">
							<h4>卡牌效果触发</h4>
							<div className="effects-list">
								{result.cardEffects.map((effect, index) => (
									<div
										key={index}
										className={`effect-item ${effect.triggered ? 'triggered' : 'failed'}`}
									>
										<span className="effect-player">
											{effect.playerId === currentPlayer?.playerId ? '你的' : '对手的'}
										</span>
										<span className="effect-card">{effect.cardName}</span>
										<span className="effect-type">
											{effect.effectType === 'penetrate' && '穿透'}
											{effect.effectType === 'develop' && '发育'}
											{effect.effectType === 'reflect' && '反弹'}
										</span>
										<span className={`effect-result ${effect.triggered ? 'success' : 'fail'}`}>
											{effect.triggered ? '✓ 触发' : '✗ 未触发'}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 数值变化 */}
					{animationPhase === 'results' && (
						<div className="changes-section">
							<div className="player-changes current-player">
								<h4>{playerData.current.name}</h4>
								<div className="change-stats">
									{playerData.current.result.healthChange !== 0 && (
										<div className={`stat-change health ${playerData.current.result.healthChange > 0 ? 'positive' : 'negative'}`}>
											❤️ {playerData.current.result.healthChange > 0 ? '+' : ''}{playerData.current.result.healthChange}
										</div>
									)}
									{playerData.current.result.energyChange !== 0 && (
										<div className={`stat-change energy ${playerData.current.result.energyChange > 0 ? 'positive' : 'negative'}`}>
											⚡ {playerData.current.result.energyChange > 0 ? '+' : ''}{playerData.current.result.energyChange}
										</div>
									)}
									{playerData.current.result.healthChange === 0 && playerData.current.result.energyChange === 0 && (
										<div className="stat-change no-change">❤️ ⚡ No change</div>
									)}
								</div>
							</div>

							<div className="player-changes opponent-player">
								<h4>{playerData.opponent.name}</h4>
								<div className="change-stats">
									{playerData.opponent.result.healthChange !== 0 && (
										<div className={`stat-change health ${playerData.opponent.result.healthChange > 0 ? 'positive' : 'negative'}`}>
											❤️ {playerData.opponent.result.healthChange > 0 ? '+' : ''}{playerData.opponent.result.healthChange}
										</div>
									)}
									{playerData.opponent.result.energyChange !== 0 && (
										<div className={`stat-change energy ${playerData.opponent.result.energyChange > 0 ? 'positive' : 'negative'}`}>
											⚡ {playerData.opponent.result.energyChange > 0 ? '+' : ''}{playerData.opponent.result.energyChange}
										</div>
									)}
									{playerData.opponent.result.healthChange === 0 && playerData.opponent.result.energyChange === 0 && (
										<div className="stat-change no-change">❤️ ⚡ No change</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="modal-footer">
					<div className="footer-actions">
						{onHideTemporarily && (
							<button
								className="hide-btn"
								onClick={handleHideTemporarily}
								disabled={animationPhase !== 'results'}
							>
								{animationPhase === 'results' ? '暂时隐藏' : '结算中...'}
							</button>
						)}

						{/* 当游戏结束时，提供两个选项 */}
						{isGameOver && onDirectExit ? (
							<>
								<button
									className="continue-btn secondary"
									onClick={handleClose}
									disabled={animationPhase !== 'results'}
								>
									{animationPhase === 'results' ? '返回结果面板' : '结算中...'}
								</button>
								<button
									className="continue-btn primary"
									onClick={handleDirectExit}
									disabled={animationPhase !== 'results'}
								>
									{animationPhase === 'results' ? '直接退出战斗' : '结算中...'}
								</button>
							</>
						) : (
							<button
								className="continue-btn"
								onClick={handleClose}
								disabled={animationPhase !== 'results'}
							>
								{animationPhase === 'results' ? (isGameOver ? '退出战斗' : '继续游戏') : '结算中...'}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default RoundResultModal;
