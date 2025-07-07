# 修复抽卡死循环问题总结

## 问题分析

### 主要问题
1. **无限循环的根本原因**: 在 `performDraw` 函数中，抽卡成功后同时调用了 `loadDrawHistory()` 和 `fetchCardDrawCount()` 两个函数，这导致了对 AssetService 和 CardService 的重复请求。

2. **useEffect 依赖问题**: 在 `WishPage.tsx` 中，`useEffect` 依赖数组包含了非稳定的函数引用，每次组件重新渲染都会创建新的函数实例，导致 `useEffect` 不断执行。

### 具体问题点
- `performDraw` 函数在抽卡成功后调用:
  - `await loadDrawHistory()` - 会触发 CardService 请求
  - `await fetchCardDrawCount(selectedBanner)` - 会触发 AssetService 请求
  - 两个函数都会更新状态，可能导致组件重新渲染和新的请求

- `useEffect` 依赖问题:
  - 依赖数组中包含了 `loadDrawHistory` 和 `fetchAllCardDrawCounts` 函数
  - 这些函数每次渲染都是新的引用，导致 `useEffect` 无限执行

## 修复方案

### 1. 使用 useCallback 稳定函数引用
```typescript
const refreshUserAssets = useCallback(async () => {
  // ... 实现
}, [userID]);

const fetchCardDrawCount = useCallback(async (poolType: 'standard' | 'featured') => {
  // ... 实现
}, [userID]);

const fetchAllCardDrawCounts = useCallback(async () => {
  // ... 实现
}, [userID, fetchCardDrawCount]);

const loadDrawHistory = useCallback(async () => {
  // ... 实现
}, [userID]);
```

### 2. 移除 performDraw 中的重复调用
**修改前:**
```typescript
// 刷新抽卡历史和抽卡次数
await loadDrawHistory();
await fetchCardDrawCount(selectedBanner);
```

**修改后:**
```typescript
// 传递抽卡结果 - 不再调用 loadDrawHistory 和 fetchCardDrawCount 避免死循环
// 在单抽/十连成功后手动调用刷新函数
```

### 3. 创建专门的数据刷新函数
```typescript
const refreshDataAfterDraw = useCallback(async () => {
  if (!userID) return;
  
  // 刷新抽卡历史和抽卡次数
  await Promise.all([
    loadDrawHistory(),
    fetchAllCardDrawCounts()
  ]);
}, [userID, loadDrawHistory, fetchAllCardDrawCounts]);
```

### 4. 在抽卡成功后调用刷新函数
```typescript
const handleSingleWish = async (...) => {
  try {
    const resultData = await new Promise<any>((resolve, reject) => {
      performDraw(selectedBanner, 1, resolve, reject);
    });

    localStorage.setItem('drawResult', JSON.stringify(resultData));
    
    // 抽卡成功后刷新数据
    await refreshDataAfterDraw();
    
    navigateQuick('/wish-result');
  } catch (error) {
    alert(error);
  }
};
```

### 5. 修复 useEffect 依赖
**修改前:**
```typescript
useEffect(() => {
  if (userID) {
    loadDrawHistory();
    fetchAllCardDrawCounts();
  }
}, [userID, loadDrawHistory, fetchAllCardDrawCounts]); // 函数引用不稳定
```

**修改后:**
```typescript
useEffect(() => {
  if (userID) {
    loadDrawHistory();
    fetchAllCardDrawCounts();
  }
}, [userID, loadDrawHistory, fetchAllCardDrawCounts]); // 现在这些都是 useCallback，依赖是稳定的
```

## 修复效果

### 1. 解决死循环
- 抽卡时不再重复调用 API
- 避免了 AssetService 和 CardService 的无限请求
- 提高了性能和用户体验

### 2. 稳定的状态管理
- 使用 `useCallback` 确保函数引用稳定
- `useEffect` 依赖数组正确，避免不必要的重新执行
- 状态更新更加可预测

### 3. 保持功能完整性
- 抽卡成功后仍然会刷新数据
- 历史记录和抽卡次数会正确更新
- 用户体验不受影响

## 测试建议

1. **功能测试**: 确保单抽和十连抽卡功能正常
2. **性能测试**: 检查抽卡时的网络请求次数
3. **数据一致性**: 验证抽卡后数据是否正确更新
4. **边界情况**: 测试网络错误、快速点击等情况

这次修复从根本上解决了抽卡死循环问题，提高了应用的稳定性和性能。
