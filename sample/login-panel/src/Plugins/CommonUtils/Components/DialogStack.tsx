import create from 'zustand'
import { StoreApi } from 'zustand/vanilla'
import { UseBoundStore } from 'zustand/react'
import { isEqual } from 'lodash'

type DialogStackFunctionPack = {
    show: (data?: any) => void
    hide: () => void
    name: string
    data?: any
}

const dialogStackStore = create(() => ({
    stack: [] as DialogStackFunctionPack[],
}))

export function getDialogStack() {
    return dialogStackStore.getState().stack
}

export function useDialogStack() {
    return dialogStackStore(s => s.stack)
}

function pushToDialogStack(newPack: DialogStackFunctionPack) {
    const stack = getDialogStack()
    dialogStackStore.setState({ stack: stack.concat(newPack) })
    newPack.show(newPack.data)
}

export function useDialogNameStack() {
    return dialogStackStore(({ stack }) => {
        return stack.map(pack => pack.name)
    })
}

export function getDialogNameStackSnap() {
    return dialogStackStore.getState().stack.map(pack => pack.name)
}

export function isDialogInStack(dialogName: string) {
    const dialogStack = getDialogStack()
    return dialogStack.reduce((pre, cur) => {
        return cur.name === dialogName || pre
    }, false)
}

export function isDialogStackEmpty() {
    return getDialogStack().length === 0
}

type DialogStore = { openState: boolean }

export function wrapStore<T extends DialogStore>(
    dialogStore: UseBoundStore<T, StoreApi<T>>,
    showFocus: () => void = () => {}
) {
    const hideDialog = () => dialogStore.setState({ openState: false })
    const showDialog = () => {
        dialogStore.setState({ openState: true })
        showFocus()
    }
    const closeDialog = () => {
        popFromDialogStack(dialogStore.name)
    }
    const openDialog = () => {
        pushToDialogStack({ show: showDialog, hide: hideDialog, name: dialogStore.name })
    }

    return { closeDialog, openDialog }
}

export function dialogIsOnTop(dialogName: string | null) {
    const stack = getDialogStack()
    if (dialogName) {
        if (stack.length > 0) {
            return stack[stack.length - 1].name === dialogName
        } else return false
    } else return stack.length === 0
}

function removePackFromStack(stack: DialogStackFunctionPack[], location: number) {
    stack[location].hide()
    stack = stack.filter((a, index) => index !== location)
    dialogStackStore.setState({ stack })
    if (stack.length > 0) {
        const topDialog = stack[stack.length - 1]
        if (topDialog.data) {
            topDialog.show(topDialog.data)
        } else {
            topDialog.show()
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function popFromDialogStack(popName: string, data?: any) {
    const stack = getDialogStack()
    const location = stack.map(a => a.name).lastIndexOf(popName)
    if (location >= 0) {
        removePackFromStack(stack, location)
    }
    // TODO BY ALL 这种情况一般是因为openDialog没有经过wrap，closeDialog经过了wrap，之后处理一下吧，系统中这种情况可能太多了，一下子弄不完
    // else {
    //     const stackInfo = stack.map(a => a.name).join('\n')
    //     materialAlert('错误：没有找到' + '\n 当前的堆栈结构：\n' + stackInfo)
    // }
}

/*-----------------------------以下为包含数据版本的弹窗-------------------------------------- */
type DialogWithDataStore<S> = { openState: boolean; data: S }

export function wrapDialogWithDataStore<T extends DialogWithDataStore<S>, S>(
    dialogStore: UseBoundStore<T, StoreApi<T>>,
    dialogName: string,
    showFocus: () => void = () => {}
) {
    const hideDialog = () => dialogStore.setState({ openState: false })
    const showDialog = (data: S) => {
        dialogStore.setState({ openState: true, data })
        showFocus()
    }
    const closeDialog = (data: S) => {
        popFromDialogStackWithData(dialogName, data)
    }
    const openDialog = (data: S) => {
        pushToDialogStack({ show: showDialog, hide: hideDialog, name: dialogName, data })
    }
    return { closeDialog, openDialog }
}

function popFromDialogStackWithData(popName: string, data: any) {
    const stack = getDialogStack()
    const tempDialogsWithData = stack.map(a => [a.name, a.data])
    let location = -1
    for (let i = tempDialogsWithData.length - 1; i >= 0; i--) {
        const [dialogName, dialogData] = tempDialogsWithData[i]
        if (dialogName === popName && isEqual(dialogData, data)) {
            location = i
            break
        }
    }
    if (location >= 0) {
        removePackFromStack(stack, location)
    }
    // else {
    //     materialAlert('错误：没有找到' + '\n 当前的堆栈结构：\n' + popName)
    // }
}
