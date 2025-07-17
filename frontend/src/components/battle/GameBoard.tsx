import React, { useState, useEffect } from 'react';
import {ActiveAction, GameState, PassiveAction, PlayerState} from '../../services/WebSocketService';
import { getCardImage } from 'utils/cardImageMap';
import './GameBoard.css';
import {getActionDisplay} from "./RoundResultModalUtils";
import { GetUserInfoMessage } from 'Plugins/UserService/APIs/GetUserInfoMessage';

interface GameBoardProps {
	gameState: GameState;
	currentPlayer: PlayerState | null;
	opponent: PlayerState | null;
	isActionSubmitted?: boolean;
	lastRoundSelectedAction?: PassiveAction | ActiveAction;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, currentPlayer, opponent, isActionSubmitted, lastRoundSelectedAction }) => {
	// 获取卡牌效果显示
	const getCardEffectText = (card: any) => {
		const effectMap = {
			'penetrate': '穿透防御',
			'develop': '获得能量',
			'reflect': '反弹攻击'
		};
		return effectMap[card.type as keyof typeof effectMap] || '';
	};
	// 获取效果概率显示
	const getCardChanceText = (card: any) => {
		const percentage = Math.round(card.effectChance * 100);
		return `${percentage}%`;
	};

	// 添加状态来存储玩家段位信息
	const [playerRank, setPlayerRank] = useState<string>('未知段位');
	// 添加状态来存储对手段位信息
	const [opponentRank, setOpponentRank] = useState<string>('未知段位');

	// 当currentPlayer变化时获取最新的段位信息
	useEffect(() => {
		if (currentPlayer?.playerId) {
			const getUserInfoMsg = new GetUserInfoMessage(currentPlayer.playerId);
			getUserInfoMsg.send(
				(response) => {
					// 成功回调
					try {
						const data = JSON.parse(response);
						console.log('获取当前玩家信息成功:', data);
						if (data && data.rank) {
							setPlayerRank(data.rank);
						}
					} catch (error) {
						console.error('解析用户信息失败:', error);
					}
				},
				(error) => {
					// 失败回调
					console.error('获取用户段位信息失败:', error);
				}
			);
		}
	}, [currentPlayer?.playerId]);

	// 当opponent变化时获取最新的段位信息
	useEffect(() => {
		if (opponent?.playerId) {
			const getUserInfoMsg = new GetUserInfoMessage(opponent.playerId);
			getUserInfoMsg.send(
				(response) => {
					// 成功回调
					try {
						const data = JSON.parse(response);
						console.log('获取对手信息成功:', data);
						if (data && data.rank) {
							setOpponentRank(data.rank);
						}
					} catch (error) {
						console.error('解析对手信息失败:', error);
					}
				},
				(error) => {
					// 失败回调
					console.error('获取对手段位信息失败:', error);
				}
			);
		}
	}, [opponent?.playerId]);

	return (
		<div className="game-board">
			{/* 对手信息区域 */}
			<div className="player-area opponent-area">
				<div className="player-info">
					<div className="player-avatar">
						<span className="avatar-text">{opponent?.username?.charAt(0) || 'O'}</span>
					</div>
					<div className="player-details">
						<h3 className="player-name">{opponent?.username || '对手'}</h3>
						<div className="player-rank">{opponentRank}</div>
					</div>
				</div>

				<div className="player-stats">
					<div className="stat-item health">
						<span className="stat-icon">❤️</span>
						<span className="stat-value">{opponent?.health || 0}</span>
					</div>
					<div className="stat-item energy">
						<span className="stat-icon">⚡</span>
						<span className="stat-value">{opponent?.energy || 0}</span>
					</div>
				</div>

				<div className="player-action">
					<div className="action-display hidden">
							<span className="action-icon">❓</span>
							<span className="action-text">未知的行动</span>
					</div>
				</div>

				{/* 对手卡牌 */}
				<div className="player-cards">
					{opponent?.cards?.map((card, index) => {
						const cardImage = getCardImage(card.cardId);
						return (
							<div key={card.cardId} className={`card ${card.type} ${card.rarity}`}>
								{cardImage && (
									<div className="card-image">
										<img
											src={cardImage}
											alt={card.name}
											className="card-img"
										/>
									</div>
								)}
								<div className="card-name">{card.name}</div>
								<div className="card-effect">{getCardEffectText(card)}</div>
								<div className={`card-chance ${card.rarity}`}>
									{getCardChanceText(card)}
								</div>
							</div>
						);
					}) || (
							<div className="no-cards">未知卡组</div>
						)}
				</div>
			</div>

			{/* 游戏状态中央区域 */}
			<div className="game-center">
				<div className="round-info">
					<div className="round-number">
						第 {gameState.currentRound} 回合
					</div>
					<div className="round-phase">
						{gameState.roundPhase === 'waiting' && '等待开始'}
						{gameState.roundPhase === 'action' && '选择行动'}
						{gameState.roundPhase === 'result' && '结算中'}
						{gameState.roundPhase === 'finished' && '游戏结束'}
					</div>
				</div>

				{gameState.roundPhase === 'action' && (
					<div className="timer">
						<div className="timer-item">
							<div className="timer-circle">
								<div className="timer-text">{gameState.player1.remainingTime}</div>
							</div>
							<div className="timer-label">Player1 剩余时间</div>
						</div>
						<div className="timer-item">
							<div className="timer-circle">
								<div className="timer-text">{gameState.player2.remainingTime}</div>
							</div>
							<div className="timer-label">Player2 剩余时间</div>
						</div>
					</div>
				)}

				{/* 游戏规则提示 */}
				<div className="game-rules-hint">
					<div className="rule-item">
						<span className="rule-icon">🍰</span>
						<span className="rule-text">饼：+1能量，对撒-1血</span>
					</div>
					<div className="rule-item">
						<span className="rule-icon">🛡️</span>
						<span className="rule-text">防：免疫撒攻击</span>
					</div>
					<div className="rule-item">
						<span className="rule-icon">💧</span>
						<span className="rule-text">撒：-1能量，对饼-1血</span>
					</div>
				</div>
			</div>

			{/* 当前玩家信息区域 */}
			<div className="player-area current-player-area">
				<div className="player-cards">
					{currentPlayer?.cards?.map((card, index) => {
						const cardImage = getCardImage(card.cardId);
						return (
							<div key={card.cardId} className={`card ${card.type} ${card.rarity}`}>
								{cardImage && (
									<div className="card-image">
										<img
											src={cardImage}
											alt={card.name}
											className="card-img"
										/>
									</div>
								)}
								<div className="card-name">{card.name}</div>
								<div className="card-effect">{getCardEffectText(card)}</div>
								<div className={`card-chance ${card.rarity}`}>
									{getCardChanceText(card)}
								</div>
							</div>
						);
					}) || (
							<div className="no-cards">无卡牌</div>
						)}
				</div>

				<div className="player-action">
					{isActionSubmitted ? (
						<div className="action-display submitted">
							<span className="action-icon">
								{getActionDisplay(lastRoundSelectedAction).icon}
							</span>
							<span className="action-text">
								{getActionDisplay(lastRoundSelectedAction).text}
							</span>
							<div className="submitted-label">已提交</div>
						</div>
					) : (
						<div className="action-display waiting">
							<span className="action-icon">⏳</span>
							<span className="action-text">等待选择</span>
						</div>
					)}
				</div>

				<div className="player-stats">
					<div className="stat-item health">
						<span className="stat-icon">❤️</span>
						<span className="stat-value">{currentPlayer?.health || 0}</span>
					</div>
					<div className="stat-item energy">
						<span className="stat-icon">⚡</span>
						<span className="stat-value">{currentPlayer?.energy || 0}</span>
					</div>
				</div>

				<div className="player-info">
					<div className="player-avatar">
						<span className="avatar-text">{currentPlayer?.username?.charAt(0) || 'P'}</span>
					</div>
					<div className="player-details">
						<h3 className="player-name">{currentPlayer?.username || '你'}</h3>
						<div className="player-rank">{playerRank}</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GameBoard;
