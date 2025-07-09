import create from 'zustand'
import { persist } from 'zustand/middleware'
import { encryptionSessionStorage } from 'Plugins/CommonUtils/Store/DefaultStorage'
import { FriendEntry } from 'Plugins/UserService/Objects/FriendEntry'
import { BlackEntry } from 'Plugins/UserService/Objects/BlackEntry'
import { MessageEntry } from 'Plugins/UserService/Objects/MessageEntry'

export class UserInfo {
    userID: string = ''
    userName: string = ''
    // 不存储敏感信息如 passwordHash
    email: string = ''
    phoneNumber: string = ''  // 改名从 cellphone
    registerTime: string = ''  // 新增
    permissionLevel: number = 0  // 新增
    banDays: number = 0  // 新增
    isOnline: boolean = false  // 新增
    matchStatus: string = ''  // 新增
    stoneAmount: number = 0  // 新增
    cardDrawCount: number = 0  // 新增
    rank: string = ''  // 新增
    rankPosition: number = 0  // 新增
    friendList: FriendEntry[] = []  // 新增
    blackList: BlackEntry[] = []  // 新增
    messageBox: MessageEntry[] = []  // 新增

    // 可选的前端特有字段
    avatar: string = ''  // 头像URL，可能来自其他服务
    realName: string = ''  // 真实姓名，可能是可选字段
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

// 现有的导出函数保持不变
export function getUserToken(): string {
    return tokenStore.getState().userToken
}

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

export function setUserInfoField(f: string, v: string | number | boolean | any[]) {
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
