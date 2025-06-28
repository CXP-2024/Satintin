import { useEffect, useRef } from 'react'

/**
 * 防抖 Hook
 *
 * @param delayTime 防抖时间间隔（毫秒）
 * @returns 一个防抖函数，用于在指定时间间隔内执行回调函数
 *
 * @example
 * // 使用方式示例：
 * const YourComponent: React.FC = () => {
 *   const inputDelayTrigger = useDebouncedInput(500);
 *
 *   const handleInputChange = () => {
 *     // 在输入变化时执行防抖函数，延时 500 毫秒后执行回调函数
 *     inputDelayTrigger(() => {
 *       // 这里写你的回调逻辑
 *       console.log("执行防抖回调函数");
 *     });
 *   };
 *
 *   return <input onChange={handleInputChange} />;
 * };
 */
export const useDebounced = (delayTime: number = 500) => {
    const inputDelayTriggerRef = useRef<NodeJS.Timeout | null>(null)

    const inputDelayTrigger = (fn: () => void = () => {}) => {
        if (inputDelayTriggerRef.current) {
            clearTimeout(inputDelayTriggerRef.current)
        }
        inputDelayTriggerRef.current = setTimeout(() => {
            fn()
        }, delayTime)
    }

    useEffect(() => {
        return () => {
            if (inputDelayTriggerRef.current) {
                clearTimeout(inputDelayTriggerRef.current)
            }
        }
    }, [])

    return inputDelayTrigger
}
