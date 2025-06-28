import React, { forwardRef } from 'react'
import create from 'zustand'
import { Snackbar } from '@mui/material'
import MuiAlert, { AlertProps } from '@mui/material/Alert'
import { AlertColor } from '@mui/material/Alert/Alert'

const snackbarGadgetStore = create(() => ({
    openState: false,
    message: '',
    severity: 'success' as AlertColor,
}))

function closeSnackBarDialog() {
    snackbarGadgetStore.setState({ openState: false, message: '' })
}

export function SnackbarGadget({ autoHideDuration = 3000 }: { autoHideDuration?: number }) {
    const { openState, message, severity } = snackbarGadgetStore(s => ({
        openState: s.openState,
        message: s.message,
        severity: s.severity,
    }))

    const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
        return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />
    })

    let backgroundColor = 'rgba(0,0,0,0.7)'
    switch (severity) {
        case 'error':
            backgroundColor = 'red'
            break
        case 'success':
            backgroundColor = 'green'
            break
        case 'warning':
            backgroundColor = 'orange'
            break
        default:
            break
    }

    return (
        <Snackbar
            open={openState}
            autoHideDuration={autoHideDuration}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            onClose={closeSnackBarDialog}
        >
            <Alert
                severity={severity}
                style={{
                    background: backgroundColor,
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '10px 20px',
                    fontSize: '25px',
                    borderRadius: '20px',
                }}
            >
                {openState && message}
            </Alert>
        </Snackbar>
    )
}

export function openSnackBar(message: string, severity: AlertColor = 'success') {
    setTimeout(() => {
        closeSnackBarDialog()
        snackbarGadgetStore.setState({
            message: message,
            openState: true,
            severity,
        })
    }, 100)
}

export function openSnackBarSuccess(message: string) {
    setTimeout(() => {
        closeSnackBarDialog()
        snackbarGadgetStore.setState({
            message: message,
            severity: 'success',
        })
        snackbarGadgetStore.setState({
            openState: true,
        })
    }, 100)
}

export function openSnackBarWarning(message: string) {
    setTimeout(() => {
        closeSnackBarDialog()
        snackbarGadgetStore.setState({
            message: message,
            openState: true,
            severity: 'warning',
        })
    }, 100)
}

export function openSnackBarInfo(message: string) {
    setTimeout(() => {
        closeSnackBarDialog()
        snackbarGadgetStore.setState({
            message: message,
            openState: true,
            severity: 'info',
        })
    }, 100)
}

export function openSnackBarError(message: string) {
    setTimeout(() => {
        closeSnackBarDialog()
        snackbarGadgetStore.setState({
            message: message,
            openState: true,
            severity: 'error',
        })
    }, 100)
}
