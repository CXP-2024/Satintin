import { ActiveAction, PassiveAction } from "services/WebSocketService";
import { activeActions, passiveActions, specialDefenseActions } from "utils/ActionConfig";

// 获取行动显示信息
export const getActionDisplay = (action: PassiveAction | ActiveAction) => {
    if (action.actionCategory === 'passive') {
        const passiveAction = action as PassiveAction;

        // 先检查是否是特殊防御类型
        if (passiveAction.defenseType === 'object_defense' || passiveAction.defenseType === 'action_defense') {
            const specialConfig = specialDefenseActions.find(config => config.type === passiveAction.objectName);
            if (specialConfig) {
                // 处理object_defense类型
                if (passiveAction.defenseType === 'object_defense' && passiveAction.targetObject) {
                    const targetConfig = activeActions.find(config => config.type === passiveAction.targetObject);
                    return {
                        icon: `${specialConfig.icon}${targetConfig?.icon || '❓'}`,
                        text: `${specialConfig.name}(${targetConfig?.name || passiveAction.targetObject})`,
                        color: specialConfig.color
                    };
                }
                // 处理action_defense类型
                else if (passiveAction.defenseType === 'action_defense' && passiveAction.targetAction) {
                    const targetNames = passiveAction.targetAction.map(actionName => {
                        const targetConfig = activeActions.find(config => config.type === actionName);
                        return targetConfig?.name || actionName;
                    }).join('+');
                    const targetIcons = passiveAction.targetAction.map(actionName => {
                        const targetConfig = activeActions.find(config => config.type === actionName);
                        return targetConfig?.icon || '❓';
                    }).join('');
                    return {
                        icon: `${specialConfig.icon}${targetIcons}`,
                        text: `${specialConfig.name}(${targetNames})`,
                        color: specialConfig.color
                    };
                }
                // 基础特殊防御显示
                else {
                    return {
                        icon: specialConfig.icon,
                        text: specialConfig.name,
                        color: specialConfig.color
                    };
                }
            }
        }

        // 查找普通被动行动配置
        const passiveConfig = passiveActions.find(config => config.type === passiveAction.objectName);
        if (passiveConfig) {
            return {
                icon: passiveConfig.icon,
                text: passiveConfig.name,
                color: passiveConfig.color
            };
        }
    } else if (action.actionCategory === 'active') {
        const activeAction = action as ActiveAction;

        if (activeAction.actions.length === 1) {
            // 单个主动行动
            const actionConfig = activeActions.find(config => config.type === activeAction.actions[0]);
            if (actionConfig) {
                return {
                    icon: actionConfig.icon,
                    text: actionConfig.name,
                    color: actionConfig.color
                };
            }
        } else if (activeAction.actions.length > 1) {
            // 组合主动行动
            const actionNames: string[] = [];
            const actionIcons: string[] = [];
            let combinedColor = '#e74c3c'; // 默认组合颜色

            // 统计每个行动的数量
            const actionCounts: { [key: string]: number } = {};
            activeAction.actions.forEach(actionName => {
                actionCounts[actionName] = (actionCounts[actionName] || 0) + 1;
            });

            // 构建显示文本和图标
            Object.entries(actionCounts).forEach(([actionName, count]) => {
                const actionConfig = activeActions.find(config => config.type === actionName);
                if (actionConfig) {
                    actionIcons.push(actionConfig.icon);
                    if (count > 1) {
                        actionNames.push(`${actionConfig.name}×${count}`);
                    } else {
                        actionNames.push(actionConfig.name);
                    }
                }
            });

            return {
                icon: actionIcons.join(''),
                text: actionNames.join('+'),
                color: combinedColor
            };
        }
    }

    // 默认返回
    return { icon: '❓', text: '未知', color: '#95a5a6' };
};



// 获取玩家数据（当前玩家vs对手）
export const getPlayerData = (currentPlayer: any, opponent: any, currentRoundResult: any) => {
    const currentPlayerId = currentPlayer?.playerId;
    const result = currentRoundResult;

    if (result.player1Action.playerId === currentPlayerId) {
        return {
            current: {
                action: result.player1Action,
                result: result.results.player1,
                name: currentPlayer?.username || '你'
            },
            opponent: {
                action: result.player2Action,
                result: result.results.player2,
                name: opponent?.username || '对手'
            }
        };
    } else {
        return {
            current: {
                action: result.player2Action,
                result: result.results.player2,
                name: currentPlayer?.username || '你'
            },
            opponent: {
                action: result.player1Action,
                result: result.results.player1,
                name: opponent?.username || '对手'
            }
        };
    }
};

// 判断战斗结果
export const getBattleOutcome = (currentPlayer: any, opponent: any, currentRoundResult: any) => {
    const playerData = getPlayerData(currentPlayer, opponent, currentRoundResult);
    const currentHealthChange = playerData.current.result.healthChange;
    const opponentHealthChange = playerData.opponent.result.healthChange;
    const currentEnergyChange = playerData.current.result.energyChange;
    const opponentEnergyChange = playerData.opponent.result.energyChange;
    const result = currentRoundResult;

    if (result.results?.exploded) {
        const explodedPlayers = result.results.explodedPlayers || [];
        if (explodedPlayers.includes(currentPlayer?.playerId) && explodedPlayers.includes(opponent?.playerId)) {
            return { type: 'lose', message: '你们都爆炸了！' };
        } else if (explodedPlayers.includes(opponent?.playerId)) {
            return { type: 'win', message: '对手爆炸了！' };
        } else {
            return { type: 'tie', message: '你爆炸了！' };
        }
    }

    // 基于血量变化判断输赢
    if (currentHealthChange < 0 && opponentHealthChange < 0) {
        // 双方都掉血，比较掉血量
        if (Math.abs(currentHealthChange) > Math.abs(opponentHealthChange)) {
            return { type: 'lose', message: '你受到了更多伤害！' };
        } else if (Math.abs(currentHealthChange) < Math.abs(opponentHealthChange)) {
            return { type: 'win', message: '对手受到了更多伤害！' };
        } else {
            return { type: 'tie', message: '双方受到相同伤害！' };
        }
    } else if (currentHealthChange < 0) {
        return { type: 'lose', message: '你受到了伤害！' };
    } else if (opponentHealthChange < 0) {
        return { type: 'win', message: '对手受到了伤害！' };
    } else {
        // 都没掉血，基于能量变化或其他因素判断
        if (currentEnergyChange > opponentEnergyChange) {
            return { type: 'win', message: '你获得了更多能量！' };
        } else if (currentEnergyChange < opponentEnergyChange) {
            return { type: 'lose', message: '对手获得了更多能量！' };
        } else {
            return { type: 'tie', message: '平局！' };
        }
    }
};