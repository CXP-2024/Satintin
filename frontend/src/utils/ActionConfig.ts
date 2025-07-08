// Action Config TypeScript Interface

// 简单被动行动配置
import {AttackObjectName, BasicObjectName} from "../services/WebSocketService";

export const passiveActions = [
    {
        type: 'Cake' as BasicObjectName,
        icon: '🍰',
        name: '饼',
        description: '获得1能量，伤害倍率×1',
        color: '#f39c12',
        requirements: '无消耗'
    },
    {
        type: 'Pouch' as BasicObjectName,
        icon: '💰',
        name: '囊',
        description: '获得2能量，伤害倍率×3',
        color: '#8e44ad',
        requirements: '消耗所有能量'
    },
    {
        type: 'BasicShield' as BasicObjectName,
        icon: '🛡️',
        name: '弹',
        description: '可以反弹一定基础攻击类',
        color: '#3498db',
        requirements: '消耗所有能量'
    },
    {
        type: 'BasicDefense' as BasicObjectName,
        icon: '🚧',
        name: '基础防',
        description: '防御部分基础攻击类',
        color: '#95a5a6',
        requirements: '不消耗能量'
    }
];

// 主动行动配置
export const activeActions = [
    {
        type: 'Sa' as AttackObjectName,
        icon: '💧',
        name: '撒',
        description: '攻击1[普通]，防御5',
        color: '#3498db',
        requirements: '消耗1能量',
        energyCost: 1
    },
    {
        type: 'Tin' as AttackObjectName,
        icon: '⚡',
        name: 'Tin',
        description: '攻击3[普通]，防御1',
        color: '#f1c40f',
        requirements: '消耗1能量',
        energyCost: 1
    },
    {
        type: 'NanMan' as AttackObjectName,
        icon: '🏹',
        name: '南蛮',
        description: '攻击3[穿透]，防御5',
        color: '#e74c3c',
        requirements: '消耗3能量',
        energyCost: 3
    },
    {
        type: 'DaShan' as AttackObjectName,
        icon: '⚔️',
        name: '大闪',
        description: '攻击4[穿透]，防御5',
        color: '#c0392b',
        requirements: '消耗4能量',
        energyCost: 4
    },
    {
        type: 'WanJian' as AttackObjectName,
        icon: '🗡️',
        name: '万剑',
        description: '攻击2[防弹]，防御5',
        color: '#8e44ad',
        requirements: '消耗3能量',
        energyCost: 3
    },
    {
        type: 'Nuclear' as AttackObjectName,
        icon: '☢️',
        name: '核爆',
        description: '攻击5[核爆]，防御6',
        color: '#27ae60',
        requirements: '消耗5能量',
        energyCost: 5
    }
];

// 特殊防御行动配置
export const specialDefenseActions = [
    {
        type: 'object_defense' as BasicObjectName,
        icon: '🎯',
        name: '对象防御',
        description: '防御指定的一种攻击类型',
        color: '#16a085',
        requirements: '需选择防御目标'
    },
    {
        type: 'action_defense' as BasicObjectName,
        icon: '🌀',
        name: '行动防御',
        description: '防御多种攻击组合',
        color: '#2980b9',
        requirements: '需选择≥2个行动'
    }
];