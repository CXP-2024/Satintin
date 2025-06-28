export enum UserRole {
    admin = '系统管理员角色',
    normal = '普通用户角色'
}

export const userRoleList = Object.values(UserRole)

export function getUserRole(newType: string): UserRole {
    return userRoleList.filter(t => t === newType)[0]
}
