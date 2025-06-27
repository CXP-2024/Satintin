import React from 'react'
import { create } from 'zustand'

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

export function closeAlert() {
    const stack = alertStore.getState().infoStack
    alertStore.setState({ infoStack: stack.slice(0, stack.length > 0 ? stack.length - 1 : 0) })
    alertStore.setState({ openState: false })
}

export function AlertGadget() {
    const { openState, infoStack } = alertStore()

    const info = infoStack.length > 0 ? infoStack[infoStack.length - 1].info : ''
    const alertType = infoStack.length > 0 ? infoStack[infoStack.length - 1].type : 'warning'
    const message = infoStack.length > 0 ? infoStack[infoStack.length - 1].message : ''

    if (infoStack.length > 0 && openState) {
        return (
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'white',
                    padding: '20px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
            >
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                    {message || AlertTypeTranslate.get(alertType)}
                </div>
                <div style={{ marginBottom: '15px' }}>{info}</div>
                <button
                    onClick={closeAlert}
                    style={{
                        padding: '8px 16px',
                        background: '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    确定
                </button>
            </div>
        )
    }
    return null
}

const openDialog = () => {
    alertStore.setState({ openState: true })
}

export const materialAlert = (
    info: string,
    type: AlertType = 'info',
    message: string = '',
    onClose: () => void = () => { }
) => {
    openDialog()
    alertStore.setState({ infoStack: alertStore.getState().infoStack.concat({ info, type, message, onClose }) })
}

export const materialAlertSuccess = (info: string, message: string = '', onClose: () => void = () => { }) => {
    openDialog()
    alertStore.setState({
        infoStack: alertStore.getState().infoStack.concat({ info, type: 'success', message, onClose }),
    })
}

export const materialAlertError = (info: string, message: string = '', onClose: () => void = () => { }) => {
    openDialog()
    alertStore.setState({
        infoStack: alertStore.getState().infoStack.concat({ info, type: 'error', message, onClose }),
    })
}
