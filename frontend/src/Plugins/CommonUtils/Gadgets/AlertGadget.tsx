import React from 'react'
import create from 'zustand'
import { Dialog } from '@mui/material'
import { wrapStore } from 'Plugins/CommonUtils/Components/DialogStack'
import { Alert } from 'antd'

export type AlertType = 'error' | 'warning' | 'info' | 'success'

export const AlertTypeTranslate: Map<AlertType, string> = new Map([
    ['warning', '注意'],
    ['error', '错误'],
    ['info', '消息'],
    ['success', '成功'],
])

type AlertPack = {
    info: string
    type: AlertType
    message: string
    onClose: () => void
}

const alertStore = create(() => ({
    openState: false as boolean,
    infoStack: [] as AlertPack[],
}))

export const useAlertOpenState = () => alertStore(s => s.openState)
export const initAlertStore = () => {
    alertStore.setState({ openState: false, infoStack: [] })
}

const { closeDialog, openDialog } = wrapStore(alertStore)

export function closeAlert() {
    const stack = alertStore.getState().infoStack
    alertStore.setState({ infoStack: stack.slice(0, stack.length > 0 ? stack.length - 1 : 0) })
    closeDialog()
    // TODO closeDialog方法有问题，导致没法正常关闭dialog，可能需要修改dialogStack的逻辑
    alertStore.setState({ openState: false })
}

export function AlertGadget() {
    const { openState, infoStack } = alertStore()

    const info = infoStack.length > 0 ? infoStack[infoStack.length - 1].info : ''
    const alertType = infoStack.length > 0 ? infoStack[infoStack.length - 1].type : 'warning'
    /** 可以自定义message */
    const message = infoStack.length > 0 ? infoStack[infoStack.length - 1].message : ''
    const onClose = infoStack.length > 0 ? infoStack[infoStack.length - 1].onClose : () => {}

    const handleClose = () => {
        onClose()
        closeAlert()
    }
    // infoStack没有内容就不显示，否则会有一个空的dialog，关闭的时候有两个弹窗，影响体验
    if (infoStack.length > 0) {
        return (
            <Dialog
                open={openState}
                maxWidth="xl"
                onKeyDown={e => {
                    e.stopPropagation()
                    if (e.key === 'q' || e.key === 'Escape') {
                        e.preventDefault()
                        handleClose()
                    }
                }}
                style={{
                    position: 'absolute',
                    left: infoStack.length.toString() + '%',
                    top: infoStack.length.toString() + '%',
                }}
            >
                <Alert
                    message={message ? message : AlertTypeTranslate.get(alertType)}
                    description={<pre style={{ whiteSpace: 'pre-wrap' }}>{info.toString()}</pre>}
                    type={alertType}
                    style={{ minWidth: '40rem' }}
                    closable
                    showIcon
                    afterClose={handleClose}
                    onClose={handleClose}
                />
            </Dialog>
        )
    } else {
        return <div></div>
    }
}

/**
 * @param info 提示信息
 * @param type alert类型
 * @param message 额外的提示信息
 * @author 李啟隆
 */
export const materialAlert = (
    info: string,
    type: AlertType = 'info',
    message: string = '',
    onClose: () => void = () => {}
) => {
    openDialog()
    alertStore.setState({ infoStack: alertStore.getState().infoStack.concat({ info, type, message, onClose }) })
}

export const materialAlertSuccess = (info: string, message: string = '', onClose: () => void = () => {}) => {
    openDialog()
    alertStore.setState({
        infoStack: alertStore.getState().infoStack.concat({ info, type: 'success', message, onClose }),
    })
}

export const materialAlertInfo = (info: string, message: string = '', onClose: () => void = () => {}) => {
    openDialog()
    alertStore.setState({ infoStack: alertStore.getState().infoStack.concat({ info, type: 'info', message, onClose }) })
}

export const materialAlertWarning = (info: string, message: string = '', onClose: () => void = () => {}) => {
    openDialog()
    alertStore.setState({
        infoStack: alertStore.getState().infoStack.concat({ info, type: 'warning', message, onClose }),
    })
}

export const materialAlertError = (info: string, message: string = '', onClose: () => void = () => {}) => {
    openDialog()
    alertStore.setState({
        infoStack: alertStore.getState().infoStack.concat({ info, type: 'error', message, onClose }),
    })
}
