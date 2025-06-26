# 原石图标自定义说明

## 当前实现

当前代码已经将原石的钻石emoji图标替换为了自定义的SVG图片。

## 文件位置

- 图标文件：`src/assets/images/primogem-icon.svg`
- 相关组件：`src/pages/GameHomePage.tsx`
- 样式文件：`src/pages/GameHomePage.css`

## 如何替换为你自己的PNG图片

1. **准备你的PNG图片**
   - 建议图片尺寸：48x48像素或更大（保持正方形比例）
   - 图片格式：PNG（支持透明背景）
   - 建议文件名：`primogem-icon.png`

2. **替换图片文件**
   ```bash
   # 删除现有的SVG文件
   rm src/assets/images/primogem-icon.svg
   
   # 将你的PNG图片复制到该位置
   cp /path/to/your/primogem-icon.png src/assets/images/
   ```

3. **更新导入语句**
   在 `src/pages/GameHomePage.tsx` 文件中，将第4行的导入语句修改为：
   ```tsx
   import primogemIcon from '../assets/images/primogem-icon.png';
   ```

## 样式调整

如果你的图片需要不同的尺寸或样式，可以在 `src/pages/GameHomePage.css` 中调整以下样式：

```css
.primogem-icon {
	width: 40px;        /* 主要显示区域的图标大小 */
	height: 40px;
	/* 其他样式保持不变 */
}

.primogem-icon.small {
	width: 20px;        /* 头部区域的小图标大小 */
	height: 20px;
	/* 其他样式保持不变 */
}
```

## 支持的图片格式

React项目支持以下图片格式：
- PNG（推荐，支持透明背景）
- JPG/JPEG
- SVG
- GIF
- WebP

## 注意事项

- 确保图片文件大小合理（建议小于100KB）
- 如果使用透明背景的PNG，效果会更好
- 图片应该是正方形比例，避免变形
