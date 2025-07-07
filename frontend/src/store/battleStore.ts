import create from 'zustand';
import {
	GameState,
	PlayerState,
	RoundResult,
	GameOverResult,
	PassiveAction,
	ActiveAction,
	AttackObjectName,
	BasicObjectName
} from '../services/WebSocketService';
import { getUserInfo } from 'Plugins/CommonUtils/Store/UserInfoStore';

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
	selectedAction: PassiveAction | ActiveAction | null;
	selectedActiveActions: AttackObjectName[]; // 存储选中的主动行动
	selectedObjectDefenseTarget: AttackObjectName | null; // ObjectDefense的目标
	isActionSubmitted: boolean;
	roundHistory: RoundResult[];

	// UI状态
	showActionSelector: boolean;
	actionSelectorTemporarilyHidden: boolean; // 行动选择器是否被暂时隐藏
	actionSelectorExiting: boolean; // 新增：控制退出动画
	showRoundResult: boolean;
	roundResultExiting: boolean; // 新增：控制回合结果退出动画
	roundResultTemporarilyHidden: boolean; // 新增：回合结果是否被暂时隐藏
	currentRoundResult: RoundResult | null;
	lastRoundResult: RoundResult | null; // 新增：上一回合结果
	showGameOver: boolean;
	currentGameOverResult: GameOverResult | null;

	// Actions
	setRoomId: (roomId: string) => void;
	setGameState: (gameState: GameState) => void;
	setConnectionStatus: (connected: boolean, error?: string) => void;
	setPlayers: (currentPlayer: PlayerState, opponent: PlayerState) => void;
	selectPassiveAction: (objectName: BasicObjectName) => void;
	selectActiveAction: (attackName: AttackObjectName) => void;
	removeActiveAction: (attackName: AttackObjectName) => void;
	selectObjectDefenseTarget: (target: AttackObjectName) => void;
	clearSelection: () => void;
	submitAction: () => void;
	addRoundResult: (result: RoundResult) => void;
	showRoundResultModal: (result: RoundResult) => void;
	hideRoundResultModal: () => void;
	hideRoundResultTemporarily: () => void; // 新增：暂时隐藏回合结果
	showLastRoundResult: () => void; // 新增：显示上一回合结果
	showGameOverModal: (result: GameOverResult) => void;
	hideGameOverModal: () => void;
	hideActionSelectorTemporarily: () => void;
	showActionSelectorAgain: () => void;
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
	selectedActiveActions: [],
	selectedObjectDefenseTarget: null,
	isActionSubmitted: false,
	roundHistory: [],

	showActionSelector: false,
	actionSelectorTemporarilyHidden: false,
	actionSelectorExiting: false,
	showRoundResult: false,
	roundResultExiting: false,
	roundResultTemporarilyHidden: false,
	currentRoundResult: null,
	lastRoundResult: null,
	showGameOver: false,
	currentGameOverResult: null,

	// Actions
	setRoomId: (roomId: string) => {
		console.log('📝 [BattleStore] 设置房间ID:', roomId);
		set({ roomId });
	},

	setGameState: (gameState: GameState) => {
		console.log('📝 [BattleStore] 更新游戏状态:', gameState);
		const { currentPlayer } = get();
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
			console.log('📝 cannot determine current player, using existing player info');
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
		const { actionSelectorTemporarilyHidden } = get();
		const showActionSelector = gameState.roundPhase === 'action' &&
			!newCurrentPlayer.currentAction &&
			!actionSelectorTemporarilyHidden;

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

	selectPassiveAction: (objectName: BasicObjectName) => {
		console.log('📝 [BattleStore] 选择被动行动:', objectName);

		// 清除之前的选择
		set({
			selectedAction: null,
			selectedActiveActions: [],
			selectedObjectDefenseTarget: null
		});

		// 根据被动行动类型设置相应的action
		const passiveAction: PassiveAction = {
			actionCategory: 'passive',
			objectName: objectName
		};

		// 如果是特殊防御类型，需要设置defenseType
		if (objectName === 'object_defense') {
			passiveAction.defenseType = 'object_defense';
		} else if (objectName === 'action_defense') {
			passiveAction.defenseType = 'action_defense';
		}

		set({ selectedAction: passiveAction });
	},

	selectActiveAction: (attackName: AttackObjectName) => {
		console.log('📝 [BattleStore] 选择主动行动:', attackName);
		const { selectedAction, selectedActiveActions } = get();

		// 如果当前已选择被动行动
		if (selectedAction?.actionCategory === 'passive') {
			const passiveAction = selectedAction as PassiveAction;

			// ObjectDefense只能选择一个目标
			if (passiveAction.defenseType === 'object_defense') {
				set({ selectedObjectDefenseTarget: attackName });
				return;
			}

			// ActionDefense可以选择多个，包括相同的行动
			if (passiveAction.defenseType === 'action_defense') {
				const newActions = [...selectedActiveActions, attackName];
				set({ selectedActiveActions: newActions });
				return;
			}
		}

		// 普通主动行动选择，可以重复选择相同行动
		// 清除被动行动选择
		set({ selectedAction: null });

		const newActions = [...selectedActiveActions, attackName];

		set({
			selectedActiveActions: newActions,
			selectedAction: {
				actionCategory: 'active',
				actions: newActions
			} as ActiveAction
		});
	},

	removeActiveAction: (attackName: AttackObjectName) => {
		console.log('📝 [BattleStore] 移除主动行动:', attackName);
		const { selectedAction, selectedActiveActions } = get();

		// 移除一个指定的行动（只移除第一个匹配的）
		const actionIndex = selectedActiveActions.findIndex(action => action === attackName);
		if (actionIndex === -1) return;

		const newActions = [...selectedActiveActions];
		newActions.splice(actionIndex, 1);

		// 如果是在ActionDefense中移除
		if (selectedAction?.actionCategory === 'passive') {
			set({ selectedActiveActions: newActions });
			return;
		}

		// 普通主动行动中移除
		if (newActions.length === 0) {
			set({
				selectedActiveActions: newActions,
				selectedAction: null
			});
		} else {
			set({
				selectedActiveActions: newActions,
				selectedAction: {
					actionCategory: 'active',
					actions: newActions
				} as ActiveAction
			});
		}
	},

	selectObjectDefenseTarget: (target: AttackObjectName) => {
		console.log('📝 [BattleStore] 选择ObjectDefense目标:', target);
		set({ selectedObjectDefenseTarget: target });
	},

	clearSelection: () => {
		console.log('📝 [BattleStore] 清除选择');
		set({
			selectedAction: null,
			selectedActiveActions: [],
			selectedObjectDefenseTarget: null
		});
	},

	submitAction: () => {
		const { selectedAction, selectedActiveActions, selectedObjectDefenseTarget, currentPlayer } = get();

		if (!selectedAction || !currentPlayer) {
			console.error('❌ [BattleStore] 无法提交行动：缺少选择或玩家信息');
			return;
		}

		let finalAction: PassiveAction | ActiveAction;

		// 验证并构建最终行动
		if (selectedAction.actionCategory === 'passive') {
			const passiveAction = selectedAction as PassiveAction;

			// ObjectDefense必须选择目标
			if (passiveAction.defenseType === 'object_defense' && !selectedObjectDefenseTarget) {
				console.error('❌ [BattleStore] ObjectDefense必须选择防御目标');
				return;
			}

			// ActionDefense必须选择至少2个行动
			if (passiveAction.defenseType === 'action_defense' && selectedActiveActions.length < 2) {
				console.error('❌ [BattleStore] ActionDefense必须选择至少2个行动');
				return;
			}

			// 构建最终的被动行动
			finalAction = {
				...passiveAction
			};

			if (passiveAction.defenseType === 'object_defense' && selectedObjectDefenseTarget) {
				finalAction.targetObject = selectedObjectDefenseTarget;
			}

			if (passiveAction.defenseType === 'action_defense' && selectedActiveActions.length >= 2) {
				finalAction.targetAction = selectedActiveActions;
			}

			console.log('📝 [BattleStore] 提交被动行动:', finalAction);
		} else {
			// 主动行动验证
			const activeAction = selectedAction as ActiveAction;
			if (activeAction.actions.length === 0) {
				console.error('❌ [BattleStore] 主动行动不能为空');
				return;
			}

			finalAction = activeAction;
			console.log('📝 [BattleStore] 提交主动行动:', finalAction);
		}

		// 更新selectedAction为最终版本
		set({ selectedAction: finalAction });

		// 先设置退出状态，触发退出动画
		set({ actionSelectorExiting: true });
		// 延迟隐藏，等待动画完成
		setTimeout(() => {
			set({
				isActionSubmitted: true,
				showActionSelector: false,
				actionSelectorTemporarilyHidden: true,
				actionSelectorExiting: false
			});
		}, 300); // 300ms 淡出动画时间
	},

	addRoundResult: (result: RoundResult) => {
		console.log('📝 [BattleStore] 添加回合结果:', result);
		setTimeout(() => {
			set(state => ({
				roundHistory: [...state.roundHistory, result],
				isActionSubmitted: false,
				selectedAction: null,
				selectedActiveActions: [],
				selectedObjectDefenseTarget: null,
				actionSelectorTemporarilyHidden: true  // 回合结束后暂时隐藏选择器
			}));
		}, 1000);
	},

	showRoundResultModal: (result: RoundResult) => {
		console.log('📝 [BattleStore] 显示回合结果:', result);
		setTimeout(() => {
			set({
				showRoundResult: true,
				currentRoundResult: result,
				lastRoundResult: result,
				roundResultTemporarilyHidden: false
			});
		}, 1000); // 延迟1000ms显示，等待动画完成
	},

	hideRoundResultModal: () => {
		console.log('📝 [BattleStore] 隐藏回合结果');
		// 先设置退出状态，触发退出动画
		set({ roundResultExiting: true });
		setTimeout(() => {
			set({
				showRoundResult: false,
				currentRoundResult: null,
				roundResultExiting: false
			});
		}, 300); // 300ms 退出动画时间
	},

	hideRoundResultTemporarily: () => {
		console.log('📝 [BattleStore] 暂时隐藏回合结果');
		// 先设置退出状态，触发退出动画
		set({ roundResultExiting: true });
		setTimeout(() => {
			set({
				showRoundResult: false,
				currentRoundResult: null,
				roundResultExiting: false,
				roundResultTemporarilyHidden: true
			});
		}, 300); // 300ms 退出动画时间
	},

	showLastRoundResult: () => {
		console.log('📝 [BattleStore] 显示上一回合结果');
		const { lastRoundResult } = get();
		if (lastRoundResult) {
			set({
				showRoundResult: true,
				currentRoundResult: lastRoundResult,
				roundResultTemporarilyHidden: false
			});
		}
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

	hideActionSelectorTemporarily: () => {
		console.log('📝 [BattleStore] 暂时隐藏行动选择器');
		// 先设置退出状态，触发退出动画
		set({ actionSelectorExiting: true });
		setTimeout(() => {
			set({
				showActionSelector: false,
				actionSelectorTemporarilyHidden: true,
				actionSelectorExiting: false
			});
		}, 300); // 300ms 淡出动画时间
	},

	showActionSelectorAgain: () => {
		console.log('📝 [BattleStore] 重新显示行动选择器');
		const { gameState, currentPlayer } = get();
		// 只有在行动阶段且当前玩家未提交行动时才显示
		if (gameState?.roundPhase === 'action' && !currentPlayer?.currentAction) {
			set({
				showActionSelector: true,
				actionSelectorTemporarilyHidden: false
			});
		}
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
			selectedActiveActions: [],
			selectedObjectDefenseTarget: null,
			isActionSubmitted: false,
			roundHistory: [],
			showActionSelector: false,
			actionSelectorTemporarilyHidden: false,
			actionSelectorExiting: false,
			showRoundResult: false,
			roundResultExiting: false,
			roundResultTemporarilyHidden: false,
			currentRoundResult: null,
			lastRoundResult: null,
			showGameOver: false,
			currentGameOverResult: null
		});
	}
}));