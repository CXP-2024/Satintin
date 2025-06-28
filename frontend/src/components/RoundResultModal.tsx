import React, { useEffect, useState } from 'react';
import { RoundResult } from '../services/WebSocketService';
import { useBattleStore } from '../store/battleStore';
import { SoundUtils } from '../utils/soundUtils';
import './RoundResultModal.css';

interface RoundResultModalProps {
	result: RoundResult;
	onClose: () => void;
}

const RoundResultModal: React.FC<RoundResultModalProps> = ({ result, onClose }) => {
	const { currentPlayer, opponent } = useBattleStore();
	const [animationPhase, setAnimationPhase] = useState<'actions' | 'effects' | 'results'>('actions');
	const [showEffects, setShowEffects] = useState(false);

	// 获取行动显示信息
	const getActionDisplay = (action: string) => {
		switch (action) {
			case 'cake':
				return { icon: '🍰', text: '饼', color: '#f39c12' };
			case 'defense':
				return { icon: '🛡️', text: '防', color: '#3498db' };
			case 'spray':
				return { icon: '💧', text: '撒', color: '#e74c3c' };
			default:
				return { icon: '❓', text: '未知', color: '#95a5a6' };
		}
	};

	// 获取玩家数据（当前玩家vs对手）
	const getPlayerData = () => {
		const currentPlayerId = currentPlayer?.playerId;
		const opponentId = opponent?.playerId;

		if (result.player1Action.playerId === currentPlayerId) {
			return {
				current: {
					action: result.player1Action,
					result: result.results.player1,
					name: currentPlayer?.username || '你'
				},
				opponent: {
					action: result.player2Action,
					result: result.results.player2,
					name: opponent?.username || '对手'
				}
			};
		} else {
			return {
				current: {
					action: result.player2Action,
					result: result.results.player2,
					name: currentPlayer?.username || '你'
				},
				opponent: {
					action: result.player1Action,
					result: result.results.player1,
					name: opponent?.username || '对手'
				}
			};
		}
	};

	const playerData = getPlayerData();

	// 动画序列
	useEffect(() => {
		const timer1 = setTimeout(() => {
			setAnimationPhase('effects');
			setShowEffects(true);
		}, 1500);

		const timer2 = setTimeout(() => {
			setAnimationPhase('results');
		}, 3000);

		return () => {
			clearTimeout(timer1);
			clearTimeout(timer2);
		};
	}, []);

	// 判断战斗结果
	const getBattleOutcome = () => {
		const currentAction = playerData.current.action.type;
		const opponentAction = playerData.opponent.action.type;

		if (currentAction === opponentAction) {
			return { type: 'tie', message: '平局！' };
		}

		// 饼 vs 撒：撒获胜
		if ((currentAction === 'cake' && opponentAction === 'spray') ||
			(currentAction === 'spray' && opponentAction === 'cake')) {
			return currentAction === 'spray'
				? { type: 'win', message: '你的撒击中了对手的饼！' }
				: { type: 'lose', message: '对手的撒击中了你的饼！' };
		}

		// 其他情况为平局
		return { type: 'tie', message: '平局！' };
	};

	const battleOutcome = getBattleOutcome();

	// 关闭模态框
	const handleClose = () => {
		SoundUtils.playClickSound(0.5);
		onClose();
	};

	return (
		<div className="round-result-overlay">
			<div className="round-result-modal">
				<div className="modal-header">
					<h2>第 {result.round} 回合结果</h2>
				</div>

				<div className="modal-content">
					{/* 行动展示 */}
					<div className={`actions-section ${animationPhase}`}>
						<div className="player-action current-player">
							<div className="player-name">{playerData.current.name}</div>
							<div className="action-display">
								<span
									className="action-icon"
									style={{ color: getActionDisplay(playerData.current.action.type).color }}
								>
									{getActionDisplay(playerData.current.action.type).icon}
								</span>
								<span className="action-text">
									{getActionDisplay(playerData.current.action.type).text}
								</span>
							</div>
						</div>

						<div className="vs-indicator">VS</div>

						<div className="player-action opponent-player">
							<div className="player-name">{playerData.opponent.name}</div>
							<div className="action-display">
								<span
									className="action-icon"
									style={{ color: getActionDisplay(playerData.opponent.action.type).color }}
								>
									{getActionDisplay(playerData.opponent.action.type).icon}
								</span>
								<span className="action-text">
									{getActionDisplay(playerData.opponent.action.type).text}
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
								</div>
							</div>
						</div>
					)}
				</div>

				<div className="modal-footer">
					<button
						className="continue-btn"
						onClick={handleClose}
						disabled={animationPhase !== 'results'}
					>
						{animationPhase === 'results' ? '继续游戏' : '结算中...'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default RoundResultModal;
