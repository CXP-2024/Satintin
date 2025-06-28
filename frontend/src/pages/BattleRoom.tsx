import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBattleStore } from '../store/battleStore';
import { webSocketService, GameState } from '../services/WebSocketService';
import { battleTestSimulator } from '../services/BattleTestSimulator';
import PageTransition from '../components/PageTransition';
import GameBoard from '../components/GameBoard';
import ActionSelector from '../components/ActionSelector';
import RoundResultModal from '../components/RoundResultModal';
import { GameOverModal } from '../components/GameOverModal';
import './BattleRoom.css';
import clickSound from '../assets/sound/yingxiao.mp3';
import { SoundUtils } from '../utils/soundUtils';

const BattleRoom: React.FC = () => {
	const navigate = useNavigate();
	const { user, token } = useAuthStore();
	const {
		roomId,
		gameState,
		isConnected,
		connectionError,
		currentPlayer,
		opponent,
		showActionSelector,
		showRoundResult,
		currentRoundResult,
		showGameOver,
		currentGameOverResult,
		setRoomId,
		setGameState,
		setConnectionStatus,
		addRoundResult,
		showRoundResultModal,
		hideRoundResultModal,
		hideGameOverModal,
		resetBattle
	} = useBattleStore();

	const [isConnecting, setIsConnecting] = useState(true);
	const [roomStatus, setRoomStatus] = useState<'connecting' | 'waiting' | 'ready' | 'playing'>('connecting');
	const [testMode, setTestMode] = useState(false);

	// 初始化音效
	useEffect(() => {
		SoundUtils.setClickSoundSource(clickSound);
	}, []);

	// 初始化WebSocket连接
	useEffect(() => {
		const initializeConnection = async () => {
			if (!user || !token) {
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
				await webSocketService.connect(battleRoomId, token);
				setConnectionStatus(true);
				setIsConnecting(false);
				setRoomStatus('waiting');

				// 设置事件监听器
				setupWebSocketListeners();

			} catch (error) {
				console.error('❌ [BattleRoom] 连接失败:', error);
				setConnectionStatus(false, '连接失败，请重试');
				setIsConnecting(false);
			}
		};

		initializeConnection();

		// 清理函数
		return () => {
			webSocketService.disconnect();
			resetBattle();
			// 停止测试模式
			battleTestSimulator.stopTestMode();
		};
	}, [user, token, navigate, setRoomId, setConnectionStatus, resetBattle]);

	// 设置WebSocket事件监听器
	const setupWebSocketListeners = () => {
		// 游戏状态更新
		webSocketService.on('game_state', (gameState) => {
			console.log('🎮 [BattleRoom] 收到游戏状态更新:', gameState);
			setGameState(gameState);

			// 更新房间状态
			if (gameState.roundPhase === 'waiting') {
				setRoomStatus('waiting');
			} else if (gameState.roundPhase === 'action') {
				setRoomStatus('playing');
			}
		});

		// 回合结果
		webSocketService.on('round_result', (result) => {
			console.log('🎮 [BattleRoom] 收到回合结果:', result);
			addRoundResult(result);
			showRoundResultModal(result);
		});

		// 游戏结束
		webSocketService.on('game_over', (result) => {
			console.log('🎮 [BattleRoom] 游戏结束:', result);
			// TODO: 显示游戏结束界面
		});

		// 玩家加入
		webSocketService.on('player_joined', (data) => {
			console.log('🎮 [BattleRoom] 玩家加入:', data);
			setRoomStatus('ready');
		});

		// 玩家离开
		webSocketService.on('player_left', (data) => {
			console.log('🎮 [BattleRoom] 玩家离开:', data);
			setRoomStatus('waiting');
		});

		// 错误处理
		webSocketService.on('error', (error) => {
			console.error('❌ [BattleRoom] WebSocket错误:', error);
			setConnectionStatus(false, error.message);
		});

		// 连接失败
		webSocketService.on('connection_failed', () => {
			console.error('❌ [BattleRoom] 连接失败');
			setConnectionStatus(false, '连接断开，正在重试...');
		});
	};

	// 重新开始测试游戏
	const handleRestartTestGame = () => {
		SoundUtils.playClickSound(0.5);
		hideGameOverModal();

		// 重新创建测试游戏状态
		const mockGameState = battleTestSimulator.createTestGameState(user, roomId || 'test_room');
		setGameState(mockGameState);

		// 重新启动测试模式模拟器
		battleTestSimulator.startTestMode();

		console.log('🔄 [BattleRoom] 重新开始测试游戏');
	};

	// 离开房间
	const handleLeaveRoom = () => {
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

	// 进入测试模式
	const handleEnterTestMode = () => {
		SoundUtils.playClickSound(0.5);
		setTestMode(true);
		setRoomStatus('ready');
		setConnectionStatus(true);

		// 创建测试游戏状态
		const mockGameState = battleTestSimulator.createTestGameState(user, roomId || 'test_room');
		setGameState(mockGameState);

		// 启动测试模式模拟器
		battleTestSimulator.startTestMode();

		console.log('🧪 [BattleRoom] 进入测试模式，对手AI将一直使用饼:', mockGameState);
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
	if (!isConnected && connectionError && !testMode) {
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
							<button className="test-btn" onClick={handleEnterTestMode}>
								🧪 测试模式
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
						{testMode && <span className="test-mode-indicator">🧪 测试模式</span>}
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
										onClick={() => navigator.clipboard.writeText(roomId || '')}
									>
										复制房间ID
									</button>
									<button
										className="test-mode-btn"
										onClick={handleEnterTestMode}
									>
										🧪 测试模式
									</button>
								</div>
							</div>
						</div>
					)}

					{(roomStatus === 'ready' || roomStatus === 'playing') && gameState && (
						<>
							{/* 游戏界面 */}
							<GameBoard
								gameState={gameState}
								currentPlayer={currentPlayer}
								opponent={opponent}
							/>

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
						onRestart={testMode ? handleRestartTestGame : undefined}
					/>
				)}
			</div>
		</PageTransition>
	);
};

export default BattleRoom;
