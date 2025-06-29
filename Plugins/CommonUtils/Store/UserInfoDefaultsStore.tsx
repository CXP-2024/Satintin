import create from 'zustand'

class UserInfoDefaults {
    nationalID = ''
    cellphone = ''
    realName = ''
    avatar = ''
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
