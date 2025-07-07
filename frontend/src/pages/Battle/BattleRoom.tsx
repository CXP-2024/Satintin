import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBattleStore } from '../../store/battleStore';
import { webSocketService } from '../../services/WebSocketService';
import { webSocketHandles } from '../../services/WebsocketHandles';
import PageTransition from '../../components/PageTransition';
import GameBoard from './GameBoard';
import ActionSelector from './ActionSelector';
import RoundResultModal from './RoundResultModal';
import { GameOverModal } from './GameOverModal';
import './BattleRoom.css';
import clickSound from '../../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import { useUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";

const BattleRoom: React.FC = () => {
	const navigate = useNavigate();
	const user = useUserInfo();
	const {
		roomId, gameState, isConnected, connectionError, currentPlayer, opponent, showActionSelector, actionSelectorTemporarilyHidden, showRoundResult, currentRoundResult, lastRoundResult, showGameOver, currentGameOverResult,
		setRoomId, setConnectionStatus, hideRoundResultModal, hideRoundResultTemporarily, showLastRoundResult, hideGameOverModal, showActionSelectorAgain, resetBattle
	} = useBattleStore();

	const [isConnecting, setIsConnecting] = useState(true);
	const [roomStatus, setRoomStatus] = useState<'connecting' | 'waiting' | 'ready' | 'playing'>('connecting');

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 初始化WebSocket连接
	useEffect(() => {
		const initializeConnection = async () => {
			try {
				// 生成或获取房间ID（实际应用中可能从路由参数获取）
				const battleRoomId = new URLSearchParams(window.location.search).get('roomId') ||
					`room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
				setRoomId(battleRoomId);
				console.log('🎮 [BattleRoom] 初始化房间:', battleRoomId);
				// 连接WebSocket
				await webSocketService.connect(battleRoomId, user.userID, user.userName);
				setConnectionStatus(true);
				setIsConnecting(false);
				setRoomStatus('waiting');
				// 设置事件监听器
				console.log('🔌 [BattleRoom] 设置事件监听器');
				webSocketHandles.setupWebSocketListeners(setRoomStatus);
				console.log('🎮 [BattleRoom] 事件监听器已设置');
			} catch (error) {
				console.error('❌ [BattleRoom] 连接失败:', error);
				setConnectionStatus(false, '连接失败，请重试');
				setIsConnecting(false);
			}
		};
		console.log('🔌 [BattleRoom] useEffect 初始化WebSocket连接');
		initializeConnection();
		console.log('🔌 [BattleRoom] useEffect 初始化WebSocket连接完成');
		return () => {
			console.log('🔌 [BattleRoom] useEffect return 清理WebSocket连接');
			webSocketHandles.cleanupWebSocketListeners(setRoomStatus);
		};
	}, [user, setRoomId, setConnectionStatus]);

	// 离开房间
	const handleLeaveRoom = () => {
		console.log('🔙 [BattleRoom] 离开房间');
		SoundUtils.playClickSound(0.5);
		webSocketService.disconnect();
		resetBattle();
		navigate('/battle');
	};

	// 准备游戏
	const handleReady = () => {
		SoundUtils.playClickSound(0.5);
		webSocketService.sendReady();
	};

	// 重新显示行动选择器
	const handleShowActionSelector = () => {
		SoundUtils.playClickSound(0.5);
		showActionSelectorAgain();
	};

	// 查看上一回合结果
	const handleShowLastRoundResult = () => {
		SoundUtils.playClickSound(0.5);
		showLastRoundResult();
	};

	// 渲染连接状态
	if (isConnecting) {
		return (
			<PageTransition className="battle-room-page">
				<div className="battle-room connecting">
					<div className="connecting-overlay">
						<div className="connecting-spinner"></div>
						<h2>正在连接对战服务器...</h2>
						<p>请稍候</p>
					</div>
				</div>
			</PageTransition>
		);
	}

	// 渲染连接错误
	if (!isConnected && connectionError) {
		return (
			<PageTransition className="battle-room-page">
				<div className="battle-room error">
					<div className="error-overlay">
						<div className="error-icon">❌</div>
						<h2>连接失败</h2>
						<p>{connectionError}</p>
						<div className="error-actions">
							<button className="retry-btn" onClick={() => window.location.reload()}>
								重试连接
							</button>
							<button className="back-btn" onClick={handleLeaveRoom}>
								返回大厅
							</button>
						</div>
					</div>
				</div>
			</PageTransition>
		);
	}

	return (
		<PageTransition className="battle-room-page">
			<div className="battle-room">
				{/* 房间头部 */}
				<header className="room-header">
					<div className="room-info">
						<h1>对战房间</h1>
						<span className="room-id">房间ID: {roomId?.slice(-8)}</span>
					</div>
					<div className="room-status">
						<span className={`status-indicator ${roomStatus}`}>
							{roomStatus === 'waiting' && '等待对手'}
							{roomStatus === 'ready' && '准备开始'}
							{roomStatus === 'playing' && '对战中'}
						</span>
					</div>
					<button className="leave-btn" onClick={handleLeaveRoom}>
						离开房间
					</button>
				</header>

				{/* 主要内容区域 */}
				<main className="room-main">
					{roomStatus === 'waiting' && (
						<div className="waiting-area">
							<div className="waiting-message">
								<div className="waiting-icon">⏳</div>
								<h2>等待对手加入...</h2>
								<p>房间ID: {roomId}</p>
								<div className="share-room">
									<button
										className="share-btn"
										onClick={() => {
											navigator.clipboard.writeText(roomId || '')
												.then(() => {
													SoundUtils.playClickSound(0.5);
												})
												.catch(err => {
													console.error('❌ [BattleRoom] 复制房间ID失败:', err);
													alert('复制房间ID失败，请手动复制。');
												});
										}}
									>
										复制房间ID
									</button>
								</div>
							</div>
						</div>
					)}

					{roomStatus === 'ready' && gameState && (
						<div className="ready-area">
							<div className="ready-message">
								<h2>对手已就位！</h2>
								<div className="ready-players-info">
									<div className="ready-player-card">
										<h3>{currentPlayer.username || '你'}</h3>
										<p>{currentPlayer.isReady ? '✅ 已准备' : '⏳ 未准备'}</p>
									</div>
									<div className="ready-vs-divider">VS</div>
									<div className="ready-player-card">
										<h3>{opponent.username || '对手'}</h3>
										<p>{opponent.isReady ? '✅ 已准备' : '⏳ 未准备'}</p>
									</div>
								</div>
								{!currentPlayer.isReady && (
									<button
										className="ready-btn"
										onClick={handleReady}
									>
										🎮 准备战斗
									</button>
								)}
								{currentPlayer.isReady && !opponent.isReady && (
									<p className="ready-waiting-text">等待对手准备...</p>
								)}
								{currentPlayer.isReady && opponent.isReady && (
									<p className="ready-starting-text">🎉 开始战斗！</p>
								)}
							</div>
						</div>
					)}

					{roomStatus === 'playing' && gameState && (
						<>
							{/* 游戏界面 */}
							<GameBoard
								gameState={gameState}
								currentPlayer={currentPlayer}
								opponent={opponent}
							/>

							{/* 游戏控制按钮 */}
							{gameState.roundPhase === 'action' && actionSelectorTemporarilyHidden && !currentPlayer?.currentAction && (
								<div className="game-controls">
									<button
										className="show-action-selector-btn"
										onClick={handleShowActionSelector}
									>
										🎮 行动选择器
									</button>
									{lastRoundResult && (
										<button
											className="show-last-result-btn"
											onClick={handleShowLastRoundResult}
										>
											📊 上回合结果
										</button>
									)}
								</div>
							)}

							{/* 行动选择器 */}
							{showActionSelector && (
								<ActionSelector />
							)}
						</>
					)}
				</main>

				{/* 回合结果模态框 */}
				{showRoundResult && currentRoundResult && (
					<RoundResultModal
						result={currentRoundResult}
						onClose={hideRoundResultModal}
						onHideTemporarily={hideRoundResultTemporarily}
					/>
				)}

				{/* 游戏结束模态框 */}
				{showGameOver && currentGameOverResult && (
					<GameOverModal
						open={showGameOver}
						gameOverResult={currentGameOverResult}
						onClose={() => {
							hideGameOverModal();
							handleLeaveRoom();
						}}
					/>
				)}
			</div>
		</PageTransition>
	);
};

export default BattleRoom;
