# 页面过渡动画系统

## 概述

为项目实现了全新的丝滑页面过渡动画系统，为所有页面间的切换提供流畅的视觉体验。

## 功能特性

### 🎬 统一的过渡系统
- **通用钩子**: `usePageTransition` 提供统一的页面导航API
- **自动动画**: 页面进入和退出都有流畅的动画效果
- **性能优化**: 使用硬件加速和最佳实践

### 🎨 多样化的动画效果
不同页面类型使用不同的过渡效果：

- **游戏主页** (`game-page`): 3D透视进入效果
- **卡牌页面** (`card-page`): 翻转进入效果
- **战斗页面** (`battle-page`): 动态旋转进入效果
- **祈愿页面** (`wish-page`): 魔法缩放+模糊效果
- **登录/注册** (`fade-scale`): 优雅的淡入缩放效果

### 📱 响应式设计
- 移动端优化的动画参数
- 高性能设备的增强动画
- 支持用户偏好设置（减少动画）

## 使用方法

### 1. 在页面组件中使用

```tsx
import { usePageTransition } from '../hooks/usePageTransition';
import PageTransition from '../components/PageTransition';

const YourPage: React.FC = () => {
  const { navigateWithTransition, navigateQuick } = usePageTransition();

  const handleNavigation = () => {
    // 带加载消息的过渡
    navigateWithTransition('/target-page', '正在加载...');
    
    // 或者快速过渡（无加载消息）
    navigateQuick('/target-page');
  };

  return (
    <PageTransition className="your-page-type">
      <div className="your-page">
        {/* 页面内容 */}
      </div>
    </PageTransition>
  );
};
```

### 2. 可用的页面类型类名

- `game-page` - 游戏相关页面
- `card-page` - 卡牌相关页面  
- `battle-page` - 战斗相关页面
- `wish-page` - 祈愿相关页面
- `fade-scale` - 通用淡入缩放
- `slide-in` - 滑入效果
- `bounce-in` - 弹跳进入效果

## 文件结构

```
src/
├── hooks/
│   └── usePageTransition.ts      # 页面过渡钩子
├── components/
│   ├── PageTransition.tsx        # 页面过渡包装组件
│   └── PageTransition.css        # 过渡动画样式
├── styles/
│   └── transitions.css           # 全局过渡样式
└── pages/                        # 已更新的页面组件
    ├── GameHomePage.tsx
    ├── BattlePage.tsx
    ├── CardCollectionPage.tsx
    ├── WishPage.tsx
    ├── LoginPage.tsx
    └── RegisterPage.tsx
```

## 技术实现

### 动画时序
1. **退出动画**: 500ms 淡出当前页面
2. **页面导航**: 执行路由切换
3. **进入动画**: 600ms 新页面淡入并应用特效

### 性能优化
- 使用 `will-change` 属性预告动画
- 硬件加速的 transform 和 opacity 动画
- 避免引起重排的 CSS 属性
- 移动端优化的动画参数

### 浏览器兼容性
- 支持现代浏览器的 CSS Transform 3D
- 自动降级到简单过渡效果
- 尊重用户的 `prefers-reduced-motion` 设置

## 定制化

### 添加新的动画类型

在 `PageTransition.css` 中添加新的动画样式：

```css
.page-transition.your-custom-type {
  opacity: 0;
  transform: /* 你的初始变换 */;
  transition: /* 你的过渡设置 */;
}

.page-transition.your-custom-type.visible {
  opacity: 1;
  transform: /* 你的结束变换 */;
}
```

### 调整动画参数

通过修改 CSS 变量或直接编辑样式文件来调整：
- 动画持续时间
- 缓动函数
- 变换效果
- 模糊程度等

## 注意事项

1. **登录动画保留**: 原有的登录视频过渡动画已保留，无需更改
2. **向后兼容**: 现有页面功能完全不受影响
3. **性能监控**: 如在低端设备上遇到性能问题，可通过媒体查询自动降级

## 最佳实践

1. **选择合适的动画类型**: 根据页面功能选择相应的动画效果
2. **避免过度动画**: 不要在同一页面内使用过多动画效果
3. **测试性能**: 在不同设备上测试动画流畅度
4. **用户体验**: 保持动画时长适中，不要影响用户操作流程

## 效果展示

- **游戏主页**: 3D 透视旋转进入，营造沉浸感
- **战斗页面**: 动感旋转，体现战斗激烈感  
- **卡牌页面**: 翻转效果，模拟翻牌体验
- **祈愿页面**: 魔法光效，增强神秘感
- **登录注册**: 优雅淡入，专业感强
