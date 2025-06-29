import create from 'zustand'

class UserInfoDefaults {
    // 只保留可能需要默认值的字段
    phoneNumber = ''  // 改名从 cellphone
    email = ''
    realName = ''
    avatar = ''
    matchStatus = 'idle'  // 默认匹配状态
    rank = 'unranked'     // 默认段位
    permissionLevel = 1   // 默认权限级别
}

const userInfoDefaultsStore = create(() => ({
    defaults: new UserInfoDefaults(),
}))

export function useUserInfoDefaults(): UserInfoDefaults {
    return userInfoDefaultsStore(s => s.defaults)
}

export function setUserInfoDefaults(defaults: UserInfoDefaults) {
    userInfoDefaultsStore.setState({ defaults })
}

export function clearUserInfoDefaults() {
    userInfoDefaultsStore.setState({ defaults: new UserInfoDefaults() })
}
