// 兼容性导出文件 - 为了保持向后兼容，统一导出所有battle相关的stores
import { useBattleActions } from './battleUIStore';
import { useBattleGameStore, type BattleGameState } from './battleGameStore';
import { useBattleUIStore, type BattleUIState } from './battleUIStore';

// 为了向后兼容，保持原有的接口定义
interface BattleState extends BattleGameState, BattleUIState {
	// 所有属性都已在 BattleGameState 和 BattleUIState 中定义
}

// 主要导出：推荐使用的组合hook
export const useBattleStore = useBattleActions;

// 分离的stores导出（如果需要单独使用）
export { useBattleGameStore, useBattleUIStore, useBattleActions };

// 类型导出
export type { BattleState, BattleGameState, BattleUIState };