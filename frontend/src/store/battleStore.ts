import create from 'zustand';
import { GameState, PlayerState, BattleAction, RoundResult, GameOverResult } from '../services/WebSocketService';
import { getUserInfo } from '../Plugins/CommonUtils/Store/UserInfoStore';

interface BattleState {
	// 房间状态
	roomId: string | null;
	gameState: GameState | null;
	isConnected: boolean;
	connectionError: string | null;

	// 玩家状态
	currentPlayer: PlayerState | null;
	opponent: PlayerState | null;

	// 游戏流程
	selectedAction: 'cake' | 'defense' | 'spray' | null;
	isActionSubmitted: boolean;
	roundHistory: RoundResult[];

	// UI状态
	showActionSelector: boolean;
	showRoundResult: boolean;
	currentRoundResult: RoundResult | null;
	showGameOver: boolean;
	currentGameOverResult: GameOverResult | null;

	// Actions
	setRoomId: (roomId: string) => void;
	setGameState: (gameState: GameState) => void;
	setConnectionStatus: (connected: boolean, error?: string) => void;
	setPlayers: (currentPlayer: PlayerState, opponent: PlayerState) => void;
	selectAction: (action: 'cake' | 'defense' | 'spray') => void;
	submitAction: () => void;
	addRoundResult: (result: RoundResult) => void;
	showRoundResultModal: (result: RoundResult) => void;
	hideRoundResultModal: () => void;
	showGameOverModal: (result: GameOverResult) => void;
	hideGameOverModal: () => void;
	resetBattle: () => void;
}

export const useBattleStore = create<BattleState>((set, get) => ({
	// 初始状态
	roomId: null,
	gameState: null,
	isConnected: false,
	connectionError: null,

	currentPlayer: null,
	opponent: null,

	selectedAction: null,
	isActionSubmitted: false,
	roundHistory: [],

	showActionSelector: false,
	showRoundResult: false,
	currentRoundResult: null,
	showGameOver: false,
	currentGameOverResult: null,

	// Actions
	setRoomId: (roomId: string) => {
		console.log('📝 [BattleStore] 设置房间ID:', roomId);
		set({ roomId });
	},

	setGameState: (gameState: GameState) => {
		console.log('📝 [BattleStore] 更新游戏状态:', gameState);
		const { currentPlayer, opponent } = get();
		const currentUser = getUserInfo();

		// 确定当前玩家和对手 - 基于用户ID
		let newCurrentPlayer: PlayerState;
		let newOpponent: PlayerState;

		if (currentUser && gameState.player1.playerId === currentUser.userID) {
			// 当前用户是 player1
			newCurrentPlayer = gameState.player1;
			newOpponent = gameState.player2;
			console.log('📝 [BattleStore] 当前用户是 player1:', currentUser.userName);
		} else if (currentUser && gameState.player2.playerId === currentUser.userID) {
			// 当前用户是 player2
			newCurrentPlayer = gameState.player2;
			newOpponent = gameState.player1;
			console.log('📝 [BattleStore] 当前用户是 player2:', currentUser.userName);
		} else {
			// 如果无法确定，尝试使用已有的 currentPlayer 信息
			if (currentPlayer && gameState.player1.playerId === currentPlayer.playerId) {
				newCurrentPlayer = gameState.player1;
				newOpponent = gameState.player2;
			} else if (currentPlayer && gameState.player2.playerId === currentPlayer.playerId) {
				newCurrentPlayer = gameState.player2;
				newOpponent = gameState.player1;
			} else {
				// 最后的备选方案：默认 player1 为当前玩家
				console.warn('📝 [BattleStore] 无法确定当前玩家，使用默认设置');
				newCurrentPlayer = gameState.player1;
				newOpponent = gameState.player2;
			}
		}

		// 根据游戏阶段显示行动选择器
		const showActionSelector = gameState.roundPhase === 'action' &&
			!newCurrentPlayer.currentAction;

		set({
			gameState,
			currentPlayer: newCurrentPlayer,
			opponent: newOpponent,
			showActionSelector
		});
	},

	setConnectionStatus: (connected: boolean, error?: string) => {
		console.log('📝 [BattleStore] 连接状态:', connected, error);
		set({
			isConnected: connected,
			connectionError: error || null
		});
	},

	setPlayers: (currentPlayer: PlayerState, opponent: PlayerState) => {
		console.log('📝 [BattleStore] 设置玩家:', currentPlayer.username, 'vs', opponent.username);
		set({ currentPlayer, opponent });
	},

	selectAction: (action: 'cake' | 'defense' | 'spray') => {
		console.log('📝 [BattleStore] 选择行动:', action);
		set({ selectedAction: action });
	},

	submitAction: () => {
		const { selectedAction, currentPlayer } = get();
		if (!selectedAction || !currentPlayer) {
			console.error('❌ [BattleStore] 无法提交行动：缺少选择或玩家信息');
			return;
		}

		console.log('📝 [BattleStore] 提交行动:', selectedAction);
		set({
			isActionSubmitted: true,
			showActionSelector: false
		});
	},

	addRoundResult: (result: RoundResult) => {
		console.log('📝 [BattleStore] 添加回合结果:', result);
		set(state => ({
			roundHistory: [...state.roundHistory, result],
			isActionSubmitted: false,
			selectedAction: null
		}));
	},

	showRoundResultModal: (result: RoundResult) => {
		console.log('📝 [BattleStore] 显示回合结果:', result);
		set({
			showRoundResult: true,
			currentRoundResult: result
		});
	},

	hideRoundResultModal: () => {
		console.log('📝 [BattleStore] 隐藏回合结果');
		set({
			showRoundResult: false,
			currentRoundResult: null
		});
	},

	showGameOverModal: (result: GameOverResult) => {
		console.log('📝 [BattleStore] 显示游戏结束:', result);
		set({
			showGameOver: true,
			currentGameOverResult: result
		});
	},

	hideGameOverModal: () => {
		console.log('📝 [BattleStore] 隐藏游戏结束弹窗');
		set({
			showGameOver: false,
			currentGameOverResult: null
		});
	},

	resetBattle: () => {
		console.log('📝 [BattleStore] 重置对战状态');
		set({
			roomId: null,
			gameState: null,
			isConnected: false,
			connectionError: null,
			currentPlayer: null,
			opponent: null,
			selectedAction: null,
			isActionSubmitted: false,
			roundHistory: [],
			showActionSelector: false,
			showRoundResult: false,
			currentRoundResult: null,
			showGameOver: false,
			currentGameOverResult: null
		});
	}
}));
