# 警告弹窗组件使用指南

## 概述

我们为游戏创建了一个符合游戏银灰色配色风格的警告弹窗组件，用于替换原生的 `window.alert`。这个组件提供了更好的用户体验和视觉效果。

## 组件特性

- 🎨 **游戏风格设计**: 符合游戏银灰色主色调，具有毛玻璃效果
- 🔄 **动画效果**: 平滑的进入/退出动画，图标动画效果
- 📱 **响应式设计**: 适配各种屏幕尺寸
- 🎯 **多种类型**: 支持警告、错误、成功、信息四种类型
- ⏰ **自动关闭**: 可选的自动关闭功能
- 🔊 **音效集成**: 与游戏音效系统集成

## 使用方法

### 1. 全局配置

在 `App.tsx` 中已经配置了 `AlertProvider`：

```tsx
import { AlertProvider } from './components/common/AlertProvider';

function App() {
  return (
    <div className="App">
      <AlertProvider enableWindowAlertOverride={true}>
        {/* 你的应用内容 */}
      </AlertProvider>
    </div>
  );
}
```

### 2. 在组件中使用

#### 方法一：使用 Hook（推荐）

```tsx
import { useAlert } from '../components/common/AlertProvider';

const MyComponent = () => {
  const { showWarning, showError, showSuccess, showInfo } = useAlert();
  
  const handleAction = () => {
    showWarning('这是一个警告消息', '警告标题');
    showError('操作失败', '错误');
    showSuccess('操作成功！', '成功');
    showInfo('这是一些信息', '提示');
  };
  
  return <button onClick={handleAction}>显示弹窗</button>;
};
```

#### 方法二：使用工具函数

```tsx
import { showWarning, showError, showSuccess, showInfo } from '../utils/alertUtils';

const handleAction = () => {
  showWarning('战斗卡组需配置3个卡牌', '卡组配置不完整');
  showError('获取战斗卡组失败', '网络错误');
};
```

### 3. 高级配置

你也可以使用更详细的配置：

```tsx
import { useAlert } from '../components/common/AlertProvider';

const MyComponent = () => {
  const { showAlert } = useAlert();
  
  const handleCustomAlert = () => {
    showAlert({
      message: '这是一个自定义警告',
      title: '自定义标题',
      type: 'warning',
      confirmText: '我知道了',
      autoClose: 5000, // 5秒后自动关闭
      onConfirm: () => {
        console.log('用户点击了确认');
      }
    });
  };
  
  return <button onClick={handleCustomAlert}>自定义弹窗</button>;
};
```

## API 参考

### AlertModal 组件属性

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `isOpen` | `boolean` | - | 是否显示弹窗 |
| `title` | `string` | - | 弹窗标题 |
| `message` | `string` | - | 弹窗内容 |
| `type` | `'warning' \| 'error' \| 'info' \| 'success'` | `'warning'` | 弹窗类型 |
| `confirmText` | `string` | `'确定'` | 确认按钮文字 |
| `onConfirm` | `() => void` | - | 确认回调函数 |
| `onClose` | `() => void` | - | 关闭回调函数 |
| `autoClose` | `number` | - | 自动关闭时间（毫秒） |

### useAlert Hook

```tsx
const {
  showAlert,     // 显示自定义配置的弹窗
  showWarning,   // 显示警告弹窗
  showError,     // 显示错误弹窗
  showSuccess,   // 显示成功弹窗
  showInfo       // 显示信息弹窗
} = useAlert();
```

### 工具函数

```tsx
// 从 utils/alertUtils.ts 导入
import { 
  showAlert,    // 显示自定义弹窗
  showWarning,  // 显示警告弹窗
  showError,    // 显示错误弹窗
  showSuccess,  // 显示成功弹窗
  showInfo      // 显示信息弹窗
} from '../utils/alertUtils';
```

## 样式自定义

弹窗的样式定义在 `AlertModal.css` 中，你可以根据需要调整：

- `.alert-modal-warning`: 警告类型样式
- `.alert-modal-error`: 错误类型样式
- `.alert-modal-success`: 成功类型样式
- `.alert-modal-info`: 信息类型样式

## 迁移指南

### 替换 window.alert

由于 `AlertProvider` 默认启用了 `enableWindowAlertOverride`，所有的 `window.alert()` 调用会自动使用新的弹窗组件。

但建议手动替换为更具体的方法：

```tsx
// 旧代码
window.alert('操作失败');

// 新代码（推荐）
showError('操作失败', '错误');
```

### 已更新的文件

以下文件已经更新为使用新的警告弹窗组件：

- ✅ `GameHomePage.tsx` - 使用 `showWarning` 和 `showError`
- ✅ `useWishLogic.ts` - 抽卡错误提示
- ✅ `UserProfileHandles.tsx` - 好友操作提示

## 注意事项

1. **Provider 必须**: 确保 `AlertProvider` 包装了你的应用
2. **层级顺序**: 弹窗使用 `z-index: 2000`，确保不被其他元素遮挡
3. **移动端适配**: 弹窗已针对移动端进行优化
4. **性能**: 每次只能显示一个弹窗，新弹窗会替换当前弹窗

## 示例截图

弹窗具有以下视觉特效：
- 毛玻璃背景效果
- 平滑的缩放和滑动动画
- 根据类型的不同边框颜色
- 装饰性背景圆圈动画
- 按钮悬浮光效

通过这个组件，我们为游戏提供了统一、美观的用户提示体验！
