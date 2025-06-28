import { create } from 'zustand'

export class UserInfo {
    userID: string = ''
    username: string = ''
    email: string = ''
    phoneNumber: string = ''
    
    constructor() {}
}

const userInfoStore = create(() => ({
    userInfo: new UserInfo(),
    userToken: '',
}))

export const setUserInfo = (userInfo: UserInfo) => userInfoStore.setState({ userInfo })
export const setUserToken = (userToken: string) => userInfoStore.setState({ userToken })
export const getUserIDSnap = () => userInfoStore.getState().userInfo.userID
export const getUserTokenSnap = () => userInfoStore.getState().userToken
export const useUserInfo = () => userInfoStore(s => s.userInfo)
export const useUserToken = () => userInfoStore(s => s.userToken)