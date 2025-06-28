import create from 'zustand'

const globalStore = create<{
    userToken:string,
}>(() => ({
    userToken: "",
}))

export const getUserToken = ()=> globalStore.getState().userToken
export const setUserToken= (userToken: string) => globalStore.setState({ userToken})
export const useUserToken= () => globalStore(state => state.userToken)
