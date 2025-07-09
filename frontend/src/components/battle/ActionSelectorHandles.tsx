// Custom hook for ActionSelector component

import { useBattleStore } from "../../store/battleStore";
import {
    ActiveAction,
    AttackObjectName,
    BasicObjectName,
    PassiveAction,
    webSocketService
} from "../../services/WebSocketService";
import { SoundUtils } from "utils/soundUtils";
import { useUserInfo } from "Plugins/CommonUtils/Store/UserInfoStore";

// 自定义 Hook，提供 ActionSelector 的所有处理函数
export const useActionSelectorHandles = () => {
    const user = useUserInfo();
    const {
        currentPlayer,
        gameState,
        showActionSelector,
        selectedAction,
        selectedActiveActions,
        selectedObjectDefenseTarget,
        isActionSubmitted,
        lastRoundSelectedAction,
        selectPassiveAction,
        selectActiveAction,
        removeActiveAction,
        selectObjectDefenseTarget,
        clearSelection,
        submitAction,
        hideActionSelectorTemporarily,
        actionSelectorExiting
    } = useBattleStore();

    // 如果已提交行动，使用lastRoundSelectedAction来显示内容
    const displayAction = isActionSubmitted && lastRoundSelectedAction ? lastRoundSelectedAction : selectedAction;
    const displayActiveActions = isActionSubmitted && lastRoundSelectedAction?.actionCategory === 'active'
        ? (lastRoundSelectedAction as ActiveAction).actions || []
        : selectedActiveActions;
    const displayObjectDefenseTarget = isActionSubmitted && lastRoundSelectedAction?.actionCategory === 'passive'
        ? (lastRoundSelectedAction as PassiveAction).targetObject || null
        : selectedObjectDefenseTarget;

    // 检查行动是否被禁用
    const isActionDisabled = (actionType: 'passive' | 'active' | 'special') => {
        if (isActionSubmitted) return true;

        if (actionType === 'passive') {
            // 如果已选择其他类型，禁用简单被动行动
            return selectedAction?.actionCategory === 'active' ||
                (selectedAction?.actionCategory === 'passive' &&
                    (selectedAction.defenseType === 'object_defense' ||
                        selectedAction.defenseType === 'action_defense'));
        }

        if (actionType === 'active') {
            // 如果已选择简单被动行动（非特殊防御），禁用主动行动
            return selectedAction?.actionCategory === 'passive' &&
                !selectedAction.defenseType;
        }

        if (actionType === 'special') {
            // 如果已选择其他类型，禁用特殊防御
            return selectedAction?.actionCategory === 'active' ||
                (selectedAction?.actionCategory === 'passive' &&
                    !selectedAction.defenseType);
        }

        return false;
    };

    // 获取某个行动的选择次数
    const getActionCount = (actionType: AttackObjectName) => {
        return displayActiveActions.filter(action => action === actionType).length;
    };

    // 检查是否可以提交
    const canSubmit = () => {
        if (!selectedAction || isActionSubmitted) return false;

        if (selectedAction.actionCategory === 'passive') {
            const passiveAction = selectedAction;

            // object_defense必须选择目标
            if (passiveAction.defenseType === 'object_defense') {
                return selectedObjectDefenseTarget !== null;
            }

            // action_defense必须选择至少2个行动
            if (passiveAction.defenseType === 'action_defense') {
                return selectedActiveActions.length >= 2;
            }

            // 简单被动行动可以直接提交
            return true;
        }

        // 主动行动必须有选择
        return selectedActiveActions.length > 0;
    };

    // 选择被动行动
    const handleSelectPassiveAction = (actionType: BasicObjectName) => {
        if (isActionDisabled('passive') || isActionSubmitted) return;

        SoundUtils.playClickSound(0.5);
        selectPassiveAction(actionType);
    };

    // 选择主动行动
    const handleSelectActiveAction = (actionType: AttackObjectName) => {
        if (isActionSubmitted) return;

        SoundUtils.playClickSound(0.5);
        selectActiveAction(actionType);
    };

    // 移除主动行动
    const handleRemoveActiveAction = (actionType: AttackObjectName) => {
        if (isActionSubmitted) return;

        SoundUtils.playClickSound(0.3);
        removeActiveAction(actionType);
    };

    // 选择object_defense目标
    const handleSelectObjectDefenseTarget = (target: AttackObjectName) => {
        if (isActionSubmitted) return;

        SoundUtils.playClickSound(0.5);
        selectObjectDefenseTarget(target);
    };

    // 清除选择
    const handleClearSelection = () => {
        if (isActionSubmitted) return;

        SoundUtils.playClickSound(0.3);
        clearSelection();
    };

    // 暂时隐藏行动选择器
    const handleTemporaryHide = () => {
        SoundUtils.playClickSound(0.3);
        hideActionSelectorTemporarily();
    };

    // 提交行动
    const handleSubmitAction = () => {
        if (!canSubmit() || !user) return;

        SoundUtils.playClickSound(0.7);

        // 使用当前组件内的 state
        if (!selectedAction) return;

        let finalAction: PassiveAction | ActiveAction;

        // 构建最终行动（与 store 中的逻辑保持一致）
        if (selectedAction.actionCategory === 'passive') {
            const passiveAction = selectedAction as PassiveAction;

            // 构建最终的被动行动
            finalAction = {
                ...passiveAction
            };

            if (passiveAction.defenseType === 'object_defense' && selectedObjectDefenseTarget) {
                finalAction.targetObject = selectedObjectDefenseTarget;
            }

            if (passiveAction.defenseType === 'action_defense' && selectedActiveActions.length >= 2) {
                finalAction.targetAction = selectedActiveActions;
            }
        } else {
            finalAction = selectedAction as ActiveAction;
        }

        // 发送最终行动到服务器
        webSocketService.sendAction({
            type: finalAction,
            playerId: user.userID
        });

        // 更新本地状态
        submitAction();
    };

    // 返回所有状态和处理函数
    return {
        // 状态
        user,
        currentPlayer,
        gameState,
        showActionSelector,
        actionSelectorExiting,
        selectedAction: displayAction,
        selectedActiveActions: displayActiveActions,
        selectedObjectDefenseTarget: displayObjectDefenseTarget,
        isActionSubmitted,

        // 处理函数
        isActionDisabled,
        getActionCount,
        canSubmit,
        handleSelectPassiveAction,
        handleSelectActiveAction,
        handleRemoveActiveAction,
        handleSelectObjectDefenseTarget,
        handleClearSelection,
        handleTemporaryHide,
        handleSubmitAction
    };
};