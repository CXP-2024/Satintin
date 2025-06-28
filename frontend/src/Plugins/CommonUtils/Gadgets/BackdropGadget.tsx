import React from 'react'
import create from 'zustand'
import { Backdrop, CircularProgress, Typography } from '@mui/material'

const backdropGadgetStore = create(() => ({
    openState: false,
    title: '',
    count: 0,
}))

export function closeBackdropGadget() {
    backdropGadgetStore.setState({ count: backdropGadgetStore.getState().count - 1 })
    if (backdropGadgetStore.getState().count <= 0)
        backdropGadgetStore.setState({ openState: false, count: 0, title: '' })
}

export function BackdropGadget() {
    const { openState, title } = backdropGadgetStore()
    return (
        <Backdrop sx={{ color: '#fff', zIndex: 999999, display: 'flex', flexDirection: 'column' }} open={openState}>
            {title ? (
                <Typography variant="h5" sx={{ padding: '1rem 0' }}>
                    {title}
                </Typography>
            ) : (
                <></>
            )}
            <CircularProgress color="inherit" />
        </Backdrop>
    )
}

export const openBackdropGadget = (title: string = '') => {
    if (backdropGadgetStore.getState().count === 0)
        backdropGadgetStore.setState({ openState: true, count: backdropGadgetStore.getState().count + 1, title })
    else backdropGadgetStore.setState({ count: backdropGadgetStore.getState().count + 1 })
}
