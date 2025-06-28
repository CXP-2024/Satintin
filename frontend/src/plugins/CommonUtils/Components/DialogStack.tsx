import { create } from 'zustand'
import { StoreApi, UseBoundStore } from 'zustand'

type DialogStackFunctionPack = {
    show: (data?: any) => void
    hide: () => void
    name: string
    data?: any
}

const dialogStackStore = create<{
    stack: DialogStackFunctionPack[]
}>(() => ({
    stack: [] as DialogStackFunctionPack[],
}))

export function getDialogStack() {
    return dialogStackStore.getState().stack
}

export function useDialogStack() {
    return dialogStackStore(s => s.stack)
}

export function useDialogNameStack() {
    return dialogStackStore(s => s.stack.map(pack => pack.name))
}

export function getDialogNameStackSnap() {
    return dialogStackStore.getState().stack.map(pack => pack.name)
}

export function isDialogInStack(dialogName: string) {
    return dialogStackStore.getState().stack.some(pack => pack.name === dialogName)
}

export function isDialogStackEmpty() {
    return dialogStackStore.getState().stack.length === 0
}

type DialogStore = { openState: boolean }

export function wrapStore<T extends DialogStore>(
    dialogStore: UseBoundStore<StoreApi<T>>,
    dialogName: string = 'DefaultDialog'
) {
    const closeDialog = () => {
        dialogStore.setState({ openState: false } as Partial<T>)
    }
    
    const openDialog = () => {
        dialogStore.setState({ openState: true } as Partial<T>)
    }
    
    return { closeDialog, openDialog }
}
