import create from 'zustand'
import { persist } from 'zustand/middleware'
import { encryptionSessionStorage } from 'Plugins/CommonUtils/Store/DefaultStorage'

export class UserInfo {
    nationalID: string = ''
    cellphone: string = ''
    email: string = ''
    userName: string = ''
    realName: string = ''
    avatar: string = ''
    userSource: string = ''
    userID: string = ''
    invitationCode: string | null = null
}

/* userInfo存储在localStorage中 */
const userInfoStore = create(
    persist(
        () => ({
            userInfo: new UserInfo(),
        }),
        {
            name: 'userInfoStore',
            getStorage: () => encryptionSessionStorage,
        }
    )
)

/* token存储在sessionStorage中 */
const tokenStore = create(
    persist(
        () => ({
            userToken: '',
        }),
        {
            name: 'tokenStore',
            getStorage: () => encryptionSessionStorage,
        }
    )
)

export function getUserTokenSnap(): string {
    return tokenStore.getState().userToken
}

export function useUserToken(): string {
    return tokenStore(s => s.userToken)
}

export function setUserToken(userToken: string) {
    tokenStore.setState({ userToken })
}

export function getUserInfoSnap(): UserInfo {
    return userInfoStore.getState().userInfo
}

export function useUserInfo(): UserInfo {
    return userInfoStore(s => s.userInfo)
}

export function setUserInfo(userInfo: UserInfo) {
    userInfoStore.setState({ userInfo: { ...userInfo } })
}

export function getUserInfo() {
    return userInfoStore.getState().userInfo
}

export function getUserIDSnap(): string {
    return userInfoStore.getState().userInfo.userID
}

export function setUserInfoField(f: string, v: string) {
    userInfoStore.setState({
        userInfo: { ...userInfoStore.getState().userInfo, [f]: v },
    })
}

/** 初始化token  */
export const initUserToken = () => {
    tokenStore.setState({ userToken: '' })
}

/** 初始化userInfo  */
export function clearUserInfo() {
    userInfoStore.setState({ userInfo: new UserInfo() })
}
