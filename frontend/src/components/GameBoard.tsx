import React from 'react';
import { GameState, PlayerState } from '../services/WebSocketService';
import './GameBoard.css';

// 导入卡牌图片
import nailongImg from '../assets/images/nailong.png';
import gaiyaImg from '../assets/images/gaiya.png';
import mygoImg from '../assets/images/mygo.png';
import jiegeImg from '../assets/images/jiege.png';
import paimengImg from '../assets/images/paimeng.png';
import kunImg from '../assets/images/kun.png';
import manImg from '../assets/images/man.png';
import bingbingImg from '../assets/images/bingbing.png';
import wlmImg from '../assets/images/wlm.png';

interface GameBoardProps {
	gameState: GameState;
	currentPlayer: PlayerState | null;
	opponent: PlayerState | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, currentPlayer, opponent }) => {
	// 获取行动的显示文本和图标
	const getActionDisplay = (action?: string) => {
		switch (action) {
			case 'cake':
				return { icon: '🍰', text: '饼', color: '#f39c12' };
			case 'defense':
				return { icon: '🛡️', text: '防', color: '#3498db' };
			case 'spray':
				return { icon: '💧', text: '撒', color: '#e74c3c' };
			default:
				return { icon: '❓', text: '等待', color: '#95a5a6' };
		}
	};

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

	// 获取卡牌图片
	const getCardImage = (cardId: string) => {
		const imageMap: { [key: string]: string } = {
			'nailong': nailongImg,
			'gaiya': gaiyaImg,
			'mygo': mygoImg,
			'jiege': jiegeImg,
			'paimeng': paimengImg,
			'kun': kunImg,
			'man': manImg,
			'bingbing': bingbingImg,
			'wlm': wlmImg
		};
		return imageMap[cardId] || null;
	};

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
						<div className="player-rank">{opponent?.rank || '未知段位'}</div>
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
					{opponent?.currentAction ? (
						<div className="action-display revealed">
							<span className="action-icon">
								{getActionDisplay(opponent.currentAction.type).icon}
							</span>
							<span className="action-text">
								{getActionDisplay(opponent.currentAction.type).text}
							</span>
						</div>
					) : (
						<div className="action-display hidden">
							<span className="action-icon">❓</span>
							<span className="action-text">等待行动</span>
						</div>
					)}
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
						<div className="timer-circle">
							<div className="timer-text">{gameState.remainingTime}</div>
						</div>
						<div className="timer-label">剩余时间</div>
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
					{currentPlayer?.currentAction ? (
						<div className="action-display submitted">
							<span className="action-icon">
								{getActionDisplay(currentPlayer.currentAction.type).icon}
							</span>
							<span className="action-text">
								{getActionDisplay(currentPlayer.currentAction.type).text}
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
						<div className="player-rank">{currentPlayer?.rank || '未知段位'}</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GameBoard;
