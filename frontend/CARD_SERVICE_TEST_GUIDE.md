# Card Service 测试指南

## 新增的 GetCardTemplateByID API 测试

### 测试步骤

1. **打开测试页面**
   - 在浏览器中打开 `card-service-test.html`
   - 默认 Base URL 为 `http://localhost:10011`

2. **选择 API 类型**
   - 在接口类型下拉菜单中选择 `GetCardTemplateByIDMessage`
   - 注意：此 API 无需 userToken，界面会自动处理

3. **输入参数**
   - 在显示的 cardID 输入框中输入要查询的卡牌模板ID
   - 例如：`card-001`、`template-123` 等

4. **发送请求**
   - 点击"发送请求"按钮
   - 查看响应状态和返回的卡牌模板信息

### 测试样例

#### 成功案例
```json
{
  "type": "GetCardTemplateByIDMessage",
  "cardID": "card-001"
}
```

#### 预期响应
```json
{
  "success": true,
  "data": {
    "cardID": "card-001",
    "cardName": "火焰法师",
    "rarity": "稀有",
    "description": "释放火焰魔法，对敌人造成伤害",
    "attack": 5,
    "health": 3,
    "cost": 4
  }
}
```

#### 错误案例
- 如果 cardID 为空，会提示"cardID 不能为空"
- 如果 cardID 不存在，后端会返回相应的错误信息

### 所有 API 说明

| API | 需要 userToken | 必需参数 | 说明 |
|-----|---------------|----------|------|
| DrawCardMessage | ✓ | drawCount | 抽卡 |
| GetPlayerCardsMessage | ✓ | 无 | 获取玩家所有卡牌 |
| UpgradeCardMessage | ✓ | cardID | 升级卡牌 |
| ConfigureBattleDeckMessage | ✓ | cardIDs | 配置战斗卡组 |
| CreateCardTemplateMessage | ✓ | cardName, rarity, description | 创建卡牌模板 |
| GetAllCardTemplatesMessage | ✗ | 无 | 获取所有卡牌模板 |
| GetCardTemplateByIDMessage | ✗ | cardID | 根据ID获取卡牌模板 |

### 注意事项

1. **无需 userToken 的 API**
   - `GetAllCardTemplatesMessage` 和 `GetCardTemplateByIDMessage` 不需要 userToken
   - 测试页面会自动处理，不会发送 userToken 字段

2. **cardID 格式**
   - 确保输入的 cardID 是有效的格式
   - 通常为字符串类型，如 "card-001"

3. **错误处理**
   - 如果 cardID 不存在，会返回相应的错误信息
   - 网络错误会在状态栏显示"网络错误"

### 测试建议

1. **首先测试 GetAllCardTemplatesMessage**
   - 获取所有可用的卡牌模板
   - 从返回结果中选择有效的 cardID

2. **然后测试 GetCardTemplateByIDMessage**
   - 使用上一步获取的 cardID 进行测试
   - 验证返回的单个卡牌模板信息

3. **测试错误情况**
   - 尝试使用不存在的 cardID
   - 验证错误处理是否正确
