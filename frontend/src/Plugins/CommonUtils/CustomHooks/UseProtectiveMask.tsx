import { useEffect, RefObject } from 'react'

interface UseProtectiveMaskOptions {
    contentRef: RefObject<HTMLElement>
    isEnabled: boolean
    maskClassName?: string
    maskStyles?: React.CSSProperties
    onMaskClick?: (e: MouseEvent) => void
    onMaskWheel?: (e: WheelEvent) => void
    maskAddedCallback?: () => void
}

/**
 * 自定义Hook，用于创建和保护一个遮罩层
 * 即使用户通过开发者工具删除遮罩，也会自动重新创建
 */
export const useProtectiveMask = ({
    contentRef,
    isEnabled,
    maskClassName = 'protective-mask',
    maskStyles = {},
    onMaskClick,
    onMaskWheel,
    maskAddedCallback,
}: UseProtectiveMaskOptions) => {
    useEffect(() => {
        if (!isEnabled || !contentRef.current) return

        // 创建遮罩层的函数
        const createMask = () => {
            if (!contentRef.current) return

            const mask = document.createElement('div')
            mask.className = maskClassName

            // 设置基本样式
            mask.style.position = 'absolute'
            mask.style.top = '0'
            mask.style.left = '0'
            mask.style.width = '100%'
            mask.style.height = '100%'
            mask.style.pointerEvents = 'auto'
            mask.style.zIndex = '999'

            // 应用自定义样式
            Object.entries(maskStyles).forEach(([key, value]) => {
                mask.style[parseInt(key)] = value
            })

            // 添加点击事件监听
            if (onMaskClick) {
                mask.addEventListener('click', e => {
                    e.preventDefault()
                    e.stopPropagation()
                    onMaskClick(e)
                })
            }

            // 添加滚轮事件监听
            if (onMaskWheel) {
                mask.addEventListener('wheel', e => {
                    onMaskWheel(e)
                })
            } else {
                // 默认滚轮行为：临时禁用指针事件以允许滚动穿透
                mask.addEventListener('wheel', e => {
                    mask.style.pointerEvents = 'none'
                    setTimeout(() => {
                        mask.style.pointerEvents = 'auto'
                    }, 0)
                })
            }

            contentRef.current.appendChild(mask)

            // 回调通知
            if (maskAddedCallback) {
                maskAddedCallback()
            }

            return mask
        }

        // 创建MutationObserver监听DOM变化
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                // 如果遮罩层被删除，重新添加它
                if (
                    mutation.type === 'childList' &&
                    mutation.removedNodes.length > 0 &&
                    contentRef.current &&
                    !document.querySelector(`.${maskClassName}`)
                ) {
                    console.log('遮罩层被删除，重新添加')
                    createMask()
                }
            })
        })

        // 确保初始创建遮罩
        if (!document.querySelector(`.${maskClassName}`)) {
            createMask()
        }

        // 开始观察DOM变化
        if (contentRef.current) {
            observer.observe(contentRef.current, {
                childList: true,
                subtree: true,
            })
        }

        return () => {
            observer.disconnect()
            // 清理工作：组件卸载时移除遮罩
            const mask = document.querySelector(`.${maskClassName}`)
            if (mask && contentRef.current?.contains(mask)) {
                mask.remove()
            }
        }
    }, [contentRef, isEnabled, maskClassName, maskStyles, onMaskClick, onMaskWheel, maskAddedCallback])
}
