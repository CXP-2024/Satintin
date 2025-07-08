双人对战，起始每个人6血0能量，每回合结算

行动阶段：每回合行动有两种类型，玩家可以选择被动行动或主动行动
每个玩家在行动阶段只能选择一种行动类型

被动：
饼类： 获得1能量x，伤害倍率k
    饼: x=1, k=1
    馕： x=2, k=3
弹： 消耗所有能量
防类：不消耗能量
    防：免疫普通攻击
    防[class]：免疫攻击中该class的攻击值
    防[action]：免疫对应的攻击action的攻击


主动：
每个主动行动[action]
分为两种：单一行动与复合行动

这个每种不同的攻击自己都是一个object，具有攻击数值

基础类[class]

撒： 攻击[普通]1，防御5，消耗1能量，
    
tin： 攻击[普通]3，防御1，消耗1能量

穿透类：攻击，防御，消耗能量，穿透攻击
    南蛮 extends 穿透类：攻击[穿透]3，防御5，消耗3能量

    大闪 extends 穿透类：攻击[穿透]4，防御5，消耗4能量

防弹类：攻击，防御，消耗能量
    万箭 extends 防弹类：攻击[防弹]2，防御5，消耗3能量，

核爆：攻击[核爆]6，防御6，消耗6能量

单一行动extends[某个基础类]：叠加次数n,
    攻击n*攻击[攻击类型]，防御n*防御数值，消耗n*消耗能量


复合行动extends[单一行动]：多种不同单一行动的组合
    攻击为各单一行动攻击之和，防御为各单一行动防御之和，消耗能量为各单一行动消耗能量之和

每回合结束后，结算双方的血量和能量
如果一方血量小于0，则另一方获胜


结算阶段：
1. 结算回合后双方剩余能量。有某一方的回合前剩余能量小于消耗能量，则该方“爆点”，回合结束，爆点者-3血
2. 结算双方血量变化：
-双方均采取被动行动，则双方血量不变
-双方均采取主动行动
    - 双方中由任何一方为混合行动，则双方均扣 (对方攻击的数值之和-己方防御的数值之和)血
    - 双方均为单一行动
        -为同一类：按双方叠加次数消去相同部分，剩余攻击者使对方扣（攻击数值之和）血
        -为不同类：
            - 
            - 其他情况 按双方叠加次数消去相同部分，剩余攻击者使对方扣（攻击数值之和-己方防御的数值之和）血
    
-一方采取主动行动，另一方采取被动行动
    - 被动方为 饼： 被动方扣 （攻击[普通]+攻击[穿透] +攻击[防弹]数值）*伤害倍率血
    - 被动方为 防： 被动方扣 攻击[核爆]+攻击[穿透]血
    - 被动方为 弹： 被动方扣 攻击[核爆] +攻击[防弹]血， 主动防御方扣 攻击[普通] +攻击[穿透] 血
    - 被动方为 防[class]： 删除攻击方攻击中该class的攻击object，主动防御方扣 攻击[普通] +攻击[穿透] +攻击[防弹] + 攻击[核爆]血
    - 被动方为 防[action]： 若攻击方为[action]，则被动方免疫，否则被动方扣 攻击[普通] +攻击[穿透] +攻击[防弹] +
      攻击[核爆]血
3. 若有某一方血量小于0
-另一方血量>0，则另一方获胜
-双方血量均小于0，则血量高的一方获胜
-双方血量相同，则平局
4. 若有人扣血，则双方能量清零
5. 进入下一回合

我先在要按照readme文件中的说法实现前端中Action的完善制作，
推倒先前所有的只有饼防撒三类，现在我需要将其升级为复杂版本：
1）更新行动选择器首先展现左右两大板块，左边为简单被动行动：cake, pouch, BasicShield, BasicDefense四个； 右边为主动行动："Sa", "Tin", "NanMan", "DaShan", "WanJian", "Nuclear"这六种；然后下方为“特殊防”被动行动：ObjectDefense与ActionDefense两种；并在右下角提供一个确认提交按钮
2）前端给后端发送的数据类型必须是BattleAction类型
3）前端需要在传递给后端之前先验证输入行动组合的合法性：
简单被动行动只能选择一个，选择后其它行动选项卡均变成灰色的不可选择状态
同理，选择了其它主动类或特殊防类型，简单被动行动将不可选择；
最后，当选中ObjectDefense时，必须再选一张主动行动（也只能选择一张）以表示防哪种行动；当选中ActionDefense的时候，主动行动选择的数量必须要大于等于二才可以提交

interface ActionJson {
  either PassiveActionJson | ActiveActionJson;
}

// 被动行动的JSON格式
interface PassiveActionJson {
  actionCategory: "passive";
  objectName: string;  // 基础对象名称，如 "Cake", "BasicShield", "BasicDefense", "Pouch", "ObjectDefense", "ActionDefense"
  
  // 以下字段仅用于ClassDefense和ActionDefense
  defenseType?: "ObjectDefense" | "actionDefense";
  targetObject?: string;    // 用于ObjectDefense, "Sa", "Tin", "NanMan", "DaShan", "WanJian", "Nuclear"
  targetAction?: string;   // 用于ActionDefense, string 为 List[AttackObjectName]
}

// 主动行动的JSON格式
interface ActiveActionJson {
  actionCategory: "active";
  actions: string[];  // 如 ["Sa", "Tin", "Sa"], 为 List[AttackObjectName]
}

AttackObjectName: string;  // 攻击对象名称，如 "Sa", "Tin", "NanMan", "DaShan", "WanJian", "Nuclear"