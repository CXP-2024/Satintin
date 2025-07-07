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

export interface BattleGameState {
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
	submitAction: (onSubmitSuccess?: () => void) => void;
	addRoundResult: (result: RoundResult) => void;
	resetBattle: () => void;
}

export const useBattleGameStore = create<BattleGameState>((set, get) => ({
	// 初始状态
	roomId: null, gameState: null, isConnected: false, connectionError: null,
	currentPlayer: null, opponent: null,
	selectedAction: null, selectedActiveActions: [], selectedObjectDefenseTarget: null, isActionSubmitted: false, roundHistory: [],

	// Actions
	setRoomId: (roomId: string) => {
		console.log('📝 [BattleGameStore] 设置房间ID:', roomId);
		set({ roomId });
	},

	setGameState: (gameState: GameState) => {
		console.log('📝 [BattleGameStore] 更新游戏状态:', gameState);
		const { currentPlayer } = get();
		const currentUser = getUserInfo();

		// 确定当前玩家和对手 - 基于用户ID
		let newCurrentPlayer: PlayerState;
		let newOpponent: PlayerState;

		if (currentUser && gameState.player1.playerId === currentUser.userID) {
			// 当前用户是 player1
			newCurrentPlayer = gameState.player1;
			newOpponent = gameState.player2;
			console.log('📝 [BattleGameStore] 当前用户是 player1:', currentUser.userName);
		} else if (currentUser && gameState.player2.playerId === currentUser.userID) {
			// 当前用户是 player2
			newCurrentPlayer = gameState.player2;
			newOpponent = gameState.player1;
			console.log('📝 [BattleGameStore] 当前用户是 player2:', currentUser.userName);
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
				console.warn('📝 [BattleGameStore] 无法确定当前玩家，使用默认设置');
				newCurrentPlayer = gameState.player1;
				newOpponent = gameState.player2;
			}
		}

		set({gameState, currentPlayer: newCurrentPlayer, opponent: newOpponent});

		// 状态更新后，通知UI store更新行动选择器显示
		setTimeout(() => {
			const { useBattleUIStore } = require('./battleUIStore');
			useBattleUIStore.getState().updateActionSelectorVisibility();
		}, 0);
	},

	setConnectionStatus: (connected: boolean, error?: string) => {
		console.log('📝 [BattleGameStore] 连接状态:', connected, error);
		set({isConnected: connected, connectionError: error || null});
	},

	setPlayers: (currentPlayer: PlayerState, opponent: PlayerState) => {
		console.log('📝 [BattleGameStore] 设置玩家:', currentPlayer.username, 'vs', opponent.username);
		set({ currentPlayer, opponent });
	},

	selectPassiveAction: (objectName: BasicObjectName) => {
		console.log('📝 [BattleGameStore] 选择被动行动:', objectName);

		// 清除之前的选择
		set({selectedAction: null, selectedActiveActions: [], selectedObjectDefenseTarget: null});

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
		console.log('📝 [BattleGameStore] 选择主动行动:', attackName);
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
		console.log('📝 [BattleGameStore] 移除主动行动:', attackName);
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
		console.log('📝 [BattleGameStore] 选择ObjectDefense目标:', target);
		set({ selectedObjectDefenseTarget: target });
	},

	clearSelection: () => {
		console.log('📝 [BattleGameStore] 清除选择');
		set({selectedAction: null, selectedActiveActions: [], selectedObjectDefenseTarget: null});
	},

	submitAction: (onSubmitSuccess?: () => void) => {
		const { selectedAction, selectedActiveActions, selectedObjectDefenseTarget, currentPlayer } = get();

		if (!selectedAction || !currentPlayer) {
			console.error('❌ [BattleGameStore] 无法提交行动：缺少选择或玩家信息');
			return;
		}

		let finalAction: PassiveAction | ActiveAction;

		// 验证并构建最终行动
		if (selectedAction.actionCategory === 'passive') {
			const passiveAction = selectedAction as PassiveAction;

			// ObjectDefense必须选择目标
			if (passiveAction.defenseType === 'object_defense' && !selectedObjectDefenseTarget) {
				console.error('❌ [BattleGameStore] ObjectDefense必须选择防御目标');
				return;
			}

			// ActionDefense必须选择至少2个行动
			if (passiveAction.defenseType === 'action_defense' && selectedActiveActions.length < 2) {
				console.error('❌ [BattleGameStore] ActionDefense必须选择至少2个行动');
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

			console.log('📝 [BattleGameStore] 提交被动行动:', finalAction);
		} else {
			// 主动行动验证
			const activeAction = selectedAction as ActiveAction;
			if (activeAction.actions.length === 0) {
				console.error('❌ [BattleGameStore] 主动行动不能为空');
				return;
			}

			finalAction = activeAction;
			console.log('📝 [BattleGameStore] 提交主动行动:', finalAction);
		}

		// 更新selectedAction为最终版本
		set({selectedAction: finalAction, isActionSubmitted: true});

		// 调用成功回调
		if (onSubmitSuccess) {
			onSubmitSuccess();
		}
	},

	addRoundResult: (result: RoundResult) => {
		console.log('📝 [BattleGameStore] 添加回合结果:', result);
		setTimeout(() => {
			set(state => ({
				roundHistory: [...state.roundHistory, result], isActionSubmitted: false,
				selectedAction: null, selectedActiveActions: [], selectedObjectDefenseTarget: null
			}));
		}, 1000);
	},

	resetBattle: () => {
		console.log('📝 [BattleGameStore] 重置对战状态');
		set({
			roomId: null, gameState: null, isConnected: false, connectionError: null, currentPlayer: null, opponent: null,
			selectedAction: null, selectedActiveActions: [], selectedObjectDefenseTarget: null, isActionSubmitted: false,
			roundHistory: []
		});
	}
}));
