import create from 'zustand';
import {
	RoundResult,
	GameOverResult
} from '../services/WebSocketService';

export interface BattleUIState {
	// UI状态
	showActionSelector: boolean;
	actionSelectorTemporarilyHidden: boolean; // 行动选择器是否被暂时隐藏
	actionSelectorExiting: boolean; // 控制退出动画
	showRoundResult: boolean;
	roundResultExiting: boolean; // 控制回合结果退出动画
	roundResultTemporarilyHidden: boolean; // 回合结果是否被暂时隐藏
	currentRoundResult: RoundResult | null;
	lastRoundResult: RoundResult | null; // 上一回合结果
	showGameOver: boolean;
	gameOverTemporarilyHidden: boolean; // 游戏结束面板是否被暂时隐藏
	currentGameOverResult: GameOverResult | null;

	// Actions
	showRoundResultModal: (result: RoundResult) => void;
	hideRoundResultModal: () => void;
	hideRoundResultTemporarily: () => void; // 暂时隐藏回合结果
	showLastRoundResult: () => void; // 显示上一回合结果
	showGameOverModal: (result: GameOverResult) => void;
	hideGameOverModal: () => void;
	hideGameOverTemporarily: () => void; // 暂时隐藏游戏结束面板
	showGameOverAgain: () => void; // 重新显示游戏结束面板
	hideActionSelectorTemporarily: () => void;
	showActionSelectorAgain: () => void;
	updateActionSelectorVisibility: () => void; // 更新行动选择器显示状态
	resetUI: () => void;
}

export const useBattleUIStore = create<BattleUIState>((set, get) => ({
	// 初始状态
	showActionSelector: false,
	actionSelectorTemporarilyHidden: false,
	actionSelectorExiting: false,
	showRoundResult: false,
	roundResultExiting: false,
	roundResultTemporarilyHidden: false,
	currentRoundResult: null,
	lastRoundResult: null,
	showGameOver: false,
	gameOverTemporarilyHidden: false,
	currentGameOverResult: null,

	// Actions
	showRoundResultModal: (result: RoundResult) => {
		console.log('📝 [BattleUIStore] 显示回合结果:', result);
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
		console.log('📝 [BattleUIStore] 隐藏回合结果');
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
		console.log('📝 [BattleUIStore] 暂时隐藏回合结果');
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
		console.log('📝 [BattleUIStore] 显示上一回合结果');
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
		console.log('📝 [BattleUIStore] 显示游戏结束:', result);
		set({
			showGameOver: true,
			currentGameOverResult: result
		});
	},

	hideGameOverModal: () => {
		console.log('📝 [BattleUIStore] 隐藏游戏结束弹窗');
		set({
			showGameOver: false,
			currentGameOverResult: null
		});
	},

	hideGameOverTemporarily: () => {
		console.log('📝 [BattleUIStore] 暂时隐藏游戏结束面板');
		set({
			showGameOver: false,
			gameOverTemporarilyHidden: true
		});
	},

	showGameOverAgain: () => {
		console.log('📝 [BattleUIStore] 重新显示游戏结束面板');
		set({
			showGameOver: true,
			gameOverTemporarilyHidden: false
		});
	},

	hideActionSelectorTemporarily: () => {
		console.log('📝 [BattleUIStore] 暂时隐藏行动选择器');
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
		console.log('📝 [BattleUIStore] 重新显示行动选择器');
		// 注意：这里需要在使用时从外部传入gameStore，避免循环导入
		set({
			showActionSelector: true,
			actionSelectorTemporarilyHidden: false
		});
	},

	updateActionSelectorVisibility: () => {
		// 延迟导入避免循环依赖
		const { useBattleGameStore } = require('./battleGameStore');
		const gameStore = useBattleGameStore.getState();
		const { actionSelectorTemporarilyHidden } = get();

		console.log('📝 [BattleUIStore] 更新行动选择器显示状态');

		// 根据游戏阶段显示行动选择器
		const shouldShowActionSelector = gameStore.gameState?.roundPhase === 'action' &&
			!gameStore.currentPlayer?.currentAction &&
			!actionSelectorTemporarilyHidden;

		console.log('📝 [BattleUIStore] 行动选择器状态检查:', {
			roundPhase: gameStore.gameState?.roundPhase,
			currentAction: gameStore.currentPlayer?.currentAction,
			actionSelectorTemporarilyHidden,
			shouldShowActionSelector
		});

		set({ showActionSelector: shouldShowActionSelector });
	},

	resetUI: () => {
		console.log('📝 [BattleUIStore] 重置UI状态');
		set({
			showActionSelector: false,
			actionSelectorTemporarilyHidden: false,
			actionSelectorExiting: false,
			showRoundResult: false,
			roundResultExiting: false,
			roundResultTemporarilyHidden: false,
			currentRoundResult: null,
			lastRoundResult: null,
			showGameOver: false,
			gameOverTemporarilyHidden: false,
			currentGameOverResult: null
		});
	}
}));

// 创建一个组合 hook，用于同时处理 UI 交互
export const useBattleActions = () => {
	// 延迟导入，避免循环依赖
	const { useBattleGameStore } = require('./battleGameStore');

	const gameStore = useBattleGameStore();
	const uiStore = useBattleUIStore();

	const submitActionWithUI = () => {
		gameStore.submitAction(() => {
			// 成功提交后的UI处理
			uiStore.hideActionSelectorTemporarily();
		});
	};

	const addRoundResultWithUI = (result: RoundResult) => {
		gameStore.addRoundResult(result);
		uiStore.showRoundResultModal(result);
		// 回合结束后暂时隐藏选择器
		setTimeout(() => {
			uiStore.hideActionSelectorTemporarily();
		}, 1000);
	};

	const resetBattleComplete = () => {
		gameStore.resetBattle();
		uiStore.resetUI();
	};

	// 增强的showActionSelectorAgain，包含游戏状态检查
	const showActionSelectorAgain = () => {
		console.log('📝 [BattleActions] 重新显示行动选择器');
		// 只有在行动阶段且当前玩家未提交行动时才显示
		if (gameStore.gameState?.roundPhase === 'action' && !gameStore.currentPlayer?.currentAction) {
			uiStore.showActionSelectorAgain();
		}
	};

	// 增强的updateActionSelectorVisibility，包含游戏状态检查
	const updateActionSelectorVisibility = () => {
		console.log('📝 [BattleActions] 更新行动选择器显示状态');
		const shouldShowActionSelector = gameStore.gameState?.roundPhase === 'action' &&
			!gameStore.currentPlayer?.currentAction &&
			!uiStore.actionSelectorTemporarilyHidden;

		if (shouldShowActionSelector && !uiStore.showActionSelector) {
			uiStore.showActionSelectorAgain();
		} else if (!shouldShowActionSelector && uiStore.showActionSelector) {
			uiStore.hideActionSelectorTemporarily();
		}
	};

	return {
		...gameStore,
		...uiStore,
		submitActionWithUI,
		addRoundResultWithUI,
		resetBattleComplete,
		showActionSelectorAgain,
		updateActionSelectorVisibility
	};
};
