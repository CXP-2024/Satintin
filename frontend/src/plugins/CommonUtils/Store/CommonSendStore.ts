import { create } from 'zustand'

const commonSendStore = create(() => ({
    autoRedirectTimer: null as null | number,
}))

export const setAutoRedirectTimer = (autoRedirectTimer: null | number) =>
    commonSendStore.setState({ autoRedirectTimer })
export const useAutoRedirectTimer = () => commonSendStore(s => s.autoRedirectTimer)
export const getAutoRedirectTimerSnap = () => commonSendStore.getState().autoRedirectTimer
