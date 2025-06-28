export enum ActionType {
    pancake = '代表Pancake动作',
    defense = '代表防御动作',
    spray = '代表喷射动作'
}

export const actionTypeList = Object.values(ActionType)

export function getActionType(newType: string): ActionType {
    return actionTypeList.filter(t => t === newType)[0]
}
