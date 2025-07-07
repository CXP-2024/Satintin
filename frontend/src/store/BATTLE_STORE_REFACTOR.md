# Battle Store 重构说明

## 概述

为了提高代码的可维护性和模块化程度，我们将原来的 `battleStore.ts` 文件拆分成了两个更专注的模块：

## 文件结构

### 1. `battleGameStore.ts` - 核心游戏逻辑
负责管理游戏的核心状态和业务逻辑：

**主要功能：**
- 房间状态管理 (roomId, gameState, connection)
- 玩家状态管理 (currentPlayer, opponent)
- 游戏流程控制 (selectedAction, roundHistory, submission)
- 行动选择逻辑 (passive/active actions, targets)

**关键方法：**
- `setGameState()` - 游戏状态更新，包含玩家身份识别逻辑
- `selectPassiveAction()` / `selectActiveAction()` - 行动选择
- `submitAction()` - 行动提交和验证
- `addRoundResult()` - 回合结果处理

### 2. `battleUIStore.ts` - UI状态和交互
专门管理UI相关的状态和动画控制：

**主要功能：**
- 模态框显示控制 (showActionSelector, showRoundResult, showGameOver)
- 动画状态管理 (exiting states, temporarily hidden)
- UI交互逻辑 (modal show/hide with animations)

**关键方法：**
- `showRoundResultModal()` / `hideRoundResultModal()` - 回合结果弹窗
- `showGameOverModal()` / `hideGameOverModal()` - 游戏结束弹窗
- `hideActionSelectorTemporarily()` - 行动选择器控制
- `useBattleActions()` - 组合hook，提供统一的接口

### 3. `battleStore.ts` - 兼容性导出
保持向后兼容性的统一导出文件，现有代码无需修改。

## 使用方式

### 推荐用法（新代码）
```typescript
import { useBattleActions } from '../store/battleUIStore';

const YourComponent = () => {
  const {
    // 游戏状态
    gameState,
    currentPlayer,
    opponent,
    
    // 行动相关
    selectActiveAction,
    submitActionWithUI, // 带UI交互的提交
    
    // UI状态
    showActionSelector,
    showRoundResult,
    
    // 组合方法
    addRoundResultWithUI,
    resetBattleComplete
  } = useBattleActions();
  
  // ... 组件逻辑
};
```

### 向后兼容用法（现有代码）
```typescript
import { useBattleStore } from '../store/battleStore';

// 现有代码无需修改，继续正常工作
const YourComponent = () => {
  const { gameState, selectActiveAction, submitAction } = useBattleStore();
  // ...
};
```

### 分离使用（特殊场景）
```typescript
import { useBattleGameStore } from '../store/battleGameStore';
import { useBattleUIStore } from '../store/battleUIStore';

// 只需要游戏逻辑，不需要UI
const gameStore = useBattleGameStore();

// 只需要UI状态管理
const uiStore = useBattleUIStore();
```

## 重构亮点

1. **关注点分离**：游戏逻辑和UI逻辑完全分离
2. **可维护性提升**：每个文件职责单一，更易于理解和修改
3. **向后兼容**：现有代码无需修改
4. **组合模式**：提供灵活的使用方式
5. **动画优化**：UI状态管理更加精细，支持复杂的动画交互

## 迁移建议

1. **新组件**：优先使用 `useBattleActions()` hook
2. **现有组件**：可以继续使用 `useBattleStore()`，无需立即修改
3. **特殊需求**：可以单独使用 `useBattleGameStore()` 或 `useBattleUIStore()`

## 注意事项

- `useBattleActions()` 使用了动态导入来避免循环依赖
- UI相关的方法现在有更好的动画支持
- 游戏状态更新会自动触发相应的UI更新
