import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBattleStore } from '../store/battleStore';
import { webSocketService, GameState, GameOverResult } from '../services/WebSocketService';
import PageTransition from '../components/PageTransition';
import GameBoard from '../components/GameBoard';
import ActionSelector from '../components/ActionSelector';
import RoundResultModal from '../components/RoundResultModal';
import { GameOverModal } from '../components/GameOverModal';
import './BattleRoom.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from 'utils/soundUtils';
import {getUserInfo,useUserInfo} from "Plugins/CommonUtils/Store/UserInfoStore";

const BattleRoom: React.FC = () => {
	const navigate = useNavigate();
	const user = useUserInfo();
	const {
		roomId,
		gameState,
		isConnected,
		connectionError,
		currentPlayer,
		opponent,
		showActionSelector,
		actionSelectorTemporarilyHidden,
		showRoundResult,
		currentRoundResult,
		lastRoundResult,
		showGameOver,
		currentGameOverResult,
		setRoomId,
		setGameState,
		setConnectionStatus,
		addRoundResult,
		showRoundResultModal,
		hideRoundResultModal,
		hideRoundResultTemporarily,
		showLastRoundResult,
		showGameOverModal,
		hideGameOverModal,
		showActionSelectorAgain,
		resetBattle
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
			const userID = getUserInfo().userID;
			if (!user || !userID) {
				console.error('❌ [BattleRoom] 用户未登录');
				navigate('/login');
				return;
			}

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
				setupWebSocketListeners();
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

		// 清理函数
		return () => {
			console.log('🔌 [BattleRoom] useEffect return 清理WebSocket连接');
			// 清理所有事件监听器
			webSocketService.off('game_state', handleGameStateUpdate);
			webSocketService.off('round_result', handleRoundResult);
			webSocketService.off('game_over', handleGameOver);
			webSocketService.off('player_joined', handlePlayerJoined);
			webSocketService.off('player_left', handlePlayerLeft);
			webSocketService.off('error', handleWebSocketError);
			webSocketService.off('connection_failed', handleConnectionFailed);
		};
	}, [user, setRoomId, setConnectionStatus]);

	// 游戏状态更新处理器
	const handleGameStateUpdate = (gameState: GameState) => {
		console.log('🎮 [BattleRoom] 收到游戏状态更新:', gameState);
		setGameState(gameState);
		// 更新房间状态 - 基于游戏状态判断
		updateRoomStatusFromGameState(gameState);
	};

	// 回合结果处理器
	const handleRoundResult = (result: any) => {
		console.log('🎮 [BattleRoom] 收到回合结果:', result);
		addRoundResult(result);
		showRoundResultModal(result);
	};

	// 游戏结束处理器
	const handleGameOver = (result: GameOverResult) => {
		console.log('🎮 [BattleRoom] 游戏结束:', result);
		// 显示游戏结束弹窗
		showGameOverModal(result);
	};

	// 玩家加入处理器
	const handlePlayerJoined = (data: any) => {
		console.log('🎮 [BattleRoom] 玩家加入:', data);
		console.log('🎮 [BattleRoom] 等待后端发送更新的 game_state...');
		// 前端不做任何状态推断，完全依赖后端发送的 game_state
	};

	// 玩家离开处理器
	const handlePlayerLeft = (data: any) => {
		console.log('🎮 [BattleRoom] 玩家离开:', data);
		setRoomStatus('waiting');
	};

	// WebSocket错误处理器
	const handleWebSocketError = (error: any) => {
		console.error('❌ [BattleRoom] WebSocket错误:', error);
		setConnectionStatus(false, error.message);
	};

	// 连接失败处理器
	const handleConnectionFailed = () => {
		console.error('❌ [BattleRoom] 连接失败');
		setConnectionStatus(false, '连接断开，正在重试...');
	};

	// 设置WebSocket事件监听器
	const setupWebSocketListeners = () => {
		// 清理可能存在的旧监听器
		webSocketService.off('game_state', handleGameStateUpdate);
		webSocketService.off('round_result', handleRoundResult);
		webSocketService.off('game_over', handleGameOver);
		webSocketService.off('player_joined', handlePlayerJoined);
		webSocketService.off('player_left', handlePlayerLeft);
		webSocketService.off('error', handleWebSocketError);
		webSocketService.off('connection_failed', handleConnectionFailed);

		// 注册新的监听器
		webSocketService.on('game_state', handleGameStateUpdate);
		webSocketService.on('round_result', handleRoundResult);
		webSocketService.on('game_over', handleGameOver);
		webSocketService.on('player_joined', handlePlayerJoined);
		webSocketService.on('player_left', handlePlayerLeft);
		webSocketService.on('error', handleWebSocketError);
		webSocketService.on('connection_failed', handleConnectionFailed);
	};

	// 根据游戏状态更新房间状态
	const updateRoomStatusFromGameState = (gameState: GameState) => {
		const bothPlayersConnected = gameState.player1.isConnected &&
			gameState.player2.isConnected &&
			gameState.player1.playerId !== '' &&
			gameState.player2.playerId !== '';

		if (gameState.roundPhase === 'action') {
			setRoomStatus('playing');
		} else if (bothPlayersConnected) {
			setRoomStatus('ready');
			console.log('🎮 [BattleRoom] 两个玩家都已连接，房间状态设为ready');
		} else {
			setRoomStatus('waiting');
			console.log('🎮 [BattleRoom] 等待更多玩家，房间状态设为waiting');
		}
	};

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
