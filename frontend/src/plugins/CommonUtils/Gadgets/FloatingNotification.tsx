import React, { useEffect, useState } from 'react'
import create from 'zustand'
import { AlertColor } from '@mui/material/Alert/Alert'
import { Fade, Paper, Stack, Typography } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import InfoIcon from '@mui/icons-material/Info'
import CloseIcon from '@mui/icons-material/Close'

// 存储通知状态
const floatingNotificationStore = create(() => ({
    openState: false,
    message: '',
    severity: 'success' as AlertColor,
}))

// 关闭通知的函数
function closeNotification() {
    floatingNotificationStore.setState({ openState: false, message: '' })
}

// 获取背景颜色
const getBackgroundColor = (severity: AlertColor) => {
    switch (severity) {
        case 'success':
            return 'rgba(76, 175, 80, 0.95)'
        case 'error':
            return 'rgba(244, 67, 54, 0.95)'
        case 'warning':
            return 'rgba(255, 152, 0, 0.95)'
        case 'info':
            return 'rgba(33, 150, 243, 0.95)'
        default:
            return 'rgba(33, 150, 243, 0.95)'
    }
}

// 获取文字颜色
const getTextColor = (severity: AlertColor) => {
    return '#fff'
}

// 获取图标颜色
const getIconColor = (severity: AlertColor) => {
    return '#fff'
}

// 获取对应图标
const getIcon = (severity: AlertColor) => {
    switch (severity) {
        case 'success':
            return <CheckCircleIcon sx={{ color: getIconColor(severity), fontSize: 24 }} />
        case 'error':
            return <ErrorIcon sx={{ color: getIconColor(severity), fontSize: 24 }} />
        case 'warning':
            return <WarningIcon sx={{ color: getIconColor(severity), fontSize: 24 }} />
        case 'info':
            return <InfoIcon sx={{ color: getIconColor(severity), fontSize: 24 }} />
        default:
            return <InfoIcon sx={{ color: getIconColor(severity), fontSize: 24 }} />
    }
}

// 悬浮通知组件
export function FloatingNotification({ autoHideDuration = 3000 }: { autoHideDuration?: number }) {
    const { openState, message, severity } = floatingNotificationStore(s => ({
        openState: s.openState,
        message: s.message,
        severity: s.severity,
    }))

    // 用于控制淡出效果
    const [shouldRender, setShouldRender] = useState(false)

    useEffect(() => {
        if (openState) {
            setShouldRender(true)
            const timer = setTimeout(() => {
                closeNotification()
            }, autoHideDuration)
            return () => clearTimeout(timer)
        }
        // 等待淡出动画完成后再移除组件
        const timer = setTimeout(() => {
            setShouldRender(false)
        }, 500) // 淡出动画时间
        return () => clearTimeout(timer)
    }, [openState, autoHideDuration])

    if (!shouldRender && !openState) return null

    return (
        <Fade in={openState} timeout={{ enter: 300, exit: 500 }}>
            <Paper
                elevation={6}
                sx={{
                    position: 'fixed',
                    top: 80, // 避免与header重叠
                    right: 24,
                    zIndex: 9999,
                    minWidth: 300,
                    maxWidth: 450,
                    padding: '14px 18px', // 增加内部间距
                    background: `${getBackgroundColor(severity)} !important`,
                    borderRadius: 3, // 增加圆角
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)', // 增强阴影效果
                    transition: 'transform 0.3s ease, opacity 0.3s ease',
                    border: '1px solid rgba(255, 255, 255, 0.2)', // 添加轻微的边框
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    {getIcon(severity)}
                    <Typography
                        variant="body1"
                        sx={{
                            flex: 1,
                            color: getTextColor(severity),
                            fontWeight: 600, // 增加字体粗细
                            fontSize: '0.95rem', // 略微增加字体大小
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.15)', // 添加轻微文字阴影
                            lineHeight: 1.4, // 增加行高
                        }}
                    >
                        {message}
                    </Typography>
                    <CloseIcon
                        sx={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            cursor: 'pointer',
                            fontSize: 18,
                            '&:hover': {
                                color: '#ffffff',
                                transform: 'scale(1.1)', // 鼠标悬停时轻微放大
                            },
                            transition: 'color 0.2s, transform 0.2s',
                        }}
                        onClick={closeNotification}
                    />
                </Stack>
            </Paper>
        </Fade>
    )
}

// 打开通知的函数
export function openFloatingNotification(message: string, severity: AlertColor = 'success') {
    setTimeout(() => {
        closeNotification()
        floatingNotificationStore.setState({
            message: message,
            openState: true,
            severity,
        })
    }, 100)
}

// 成功通知
export function openFloatingSuccess(message: string) {
    setTimeout(() => {
        closeNotification()
        floatingNotificationStore.setState({
            message: message,
            severity: 'success',
            openState: true,
        })
    }, 100)
}

// 警告通知
export function openFloatingWarning(message: string) {
    setTimeout(() => {
        closeNotification()
        floatingNotificationStore.setState({
            message: message,
            openState: true,
            severity: 'warning',
        })
    }, 100)
}

// 信息通知
export function openFloatingInfo(message: string) {
    setTimeout(() => {
        closeNotification()
        floatingNotificationStore.setState({
            message: message,
            openState: true,
            severity: 'info',
        })
    }, 100)
}

// 错误通知
export function openFloatingError(message: string) {
    setTimeout(() => {
        closeNotification()
        floatingNotificationStore.setState({
            message: message,
            openState: true,
            severity: 'error',
        })
    }, 100)
}
