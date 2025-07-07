
import { webSocketService, GameState, GameOverResult } from './WebSocketService';
import { useBattleStore } from '../store/battleStore';

export class WebSocketHandles {
	private setRoomStatus: ((status: 'connecting' | 'waiting' | 'ready' | 'playing') => void) | null = null;

	constructor() {
		// 不需要在构造函数中初始化，直接使用 getState() 和相关方法
	}

	// 设置房间状态更新函数
	setRoomStatusUpdater = (setRoomStatus: (status: 'connecting' | 'waiting' | 'ready' | 'playing') => void) => {
		this.setRoomStatus = setRoomStatus;
	};

	// 游戏状态更新处理器
	handleGameStateUpdate = (gameState: GameState) => {
		console.log('🎮 [WebSocketHandles] 收到游戏状态更新:', gameState);
		useBattleStore.getState().setGameState(gameState);
		this.updateRoomStatusFromGameState(gameState);
	};

	// 回合结果处理器
	handleRoundResult = (result: any) => {
		console.log('🎮 [WebSocketHandles] 收到回合结果:', result);
		const { addRoundResult, showRoundResultModal } = useBattleStore.getState();
		addRoundResult(result);
		showRoundResultModal(result);
	};

	// 游戏结束处理器
	handleGameOver = (result: GameOverResult) => {
		console.log('🎮 [WebSocketHandles] 游戏结束:', result);
		useBattleStore.getState().showGameOverModal(result);
	};

	// 玩家加入处理器
	handlePlayerJoined = (data: any) => {
		console.log('🎮 [WebSocketHandles] 玩家加入:', data);
		console.log('🎮 [WebSocketHandles] 等待后端发送更新的 game_state...');
	};

	// 玩家离开处理器
	handlePlayerLeft = (data: any) => {
		console.log('🎮 [WebSocketHandles] 玩家离开:', data);
		if (this.setRoomStatus) {
			this.setRoomStatus('waiting');
		}
	};

	// WebSocket错误处理器
	handleWebSocketError = (error: any) => {
		console.error('❌ [WebSocketHandles] WebSocket错误:', error);
		useBattleStore.getState().setConnectionStatus(false, error.message);
	};

	// 连接失败处理器
	handleConnectionFailed = () => {
		console.error('❌ [WebSocketHandles] 连接失败');
		useBattleStore.getState().setConnectionStatus(false, '连接断开，正在重试...');
	};

	// 根据游戏状态更新房间状态
	updateRoomStatusFromGameState = (gameState: GameState) => {
		if (!this.setRoomStatus) return;

		const bothPlayersConnected = gameState.player1.isConnected &&
			gameState.player2.isConnected &&
			gameState.player1.playerId !== '' &&
			gameState.player2.playerId !== '';

		if (gameState.roundPhase === 'action') {
			this.setRoomStatus('playing');
		} else if (bothPlayersConnected) {
			this.setRoomStatus('ready');
			console.log('🎮 [WebSocketHandles] 两个玩家都已连接，房间状态设为ready');
		} else {
			this.setRoomStatus('waiting');
			console.log('🎮 [WebSocketHandles] 等待更多玩家，房间状态设为waiting');
		}
	};

	// 设置WebSocket事件监听器
	setupWebSocketListeners = (setRoomStatus: (status: 'connecting' | 'waiting' | 'ready' | 'playing') => void) => {
		// 设置房间状态更新函数
		this.setRoomStatusUpdater(setRoomStatus);

		// 清理可能存在的旧监听器
		webSocketService.off('game_state', this.handleGameStateUpdate);
		webSocketService.off('round_result', this.handleRoundResult);
		webSocketService.off('game_over', this.handleGameOver);
		webSocketService.off('player_joined', this.handlePlayerJoined);
		webSocketService.off('player_left', this.handlePlayerLeft);
		webSocketService.off('error', this.handleWebSocketError);
		webSocketService.off('connection_failed', this.handleConnectionFailed);

		// 注册新的监听器
		webSocketService.on('game_state', this.handleGameStateUpdate);
		webSocketService.on('round_result', this.handleRoundResult);
		webSocketService.on('game_over', this.handleGameOver);
		webSocketService.on('player_joined', this.handlePlayerJoined);
		webSocketService.on('player_left', this.handlePlayerLeft);
		webSocketService.on('error', this.handleWebSocketError);
		webSocketService.on('connection_failed', this.handleConnectionFailed);
	};

	// 清理WebSocket事件监听器
	cleanupWebSocketListeners = (setRoomStatus: (status: 'connecting' | 'waiting' | 'ready' | 'playing') => void) => {
		console.log('🔌 [WebSocketHandles] 清理WebSocket连接');
		webSocketService.off('game_state', this.handleGameStateUpdate);
		webSocketService.off('round_result', this.handleRoundResult);
		webSocketService.off('game_over', this.handleGameOver);
		webSocketService.off('player_joined', this.handlePlayerJoined);
		webSocketService.off('player_left', this.handlePlayerLeft);
		webSocketService.off('error', this.handleWebSocketError);
		webSocketService.off('connection_failed', this.handleConnectionFailed);
	};
}

export const webSocketHandles = new WebSocketHandles();