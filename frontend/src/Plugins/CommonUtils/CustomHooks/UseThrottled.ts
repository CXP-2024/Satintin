import { useRef } from 'react'

/**
 * 节流 Hook
 *
 * @param delayTime 节流时间间隔（毫秒）
 * @returns 一个节流函数，用于在指定时间间隔内执行回调函数
 *
 * @example
 * // 使用方式示例：
 * const YourComponent: React.FC = () => {
 *   const handleScrollThrottled = useThrottled(300);
 *
 *   const handleScroll = () => {
 *     handleScrollThrottled(() => {
 *       // 这里写你的回调逻辑
 *       console.log("执行节流回调函数");
 *     });
 *   };
 *
 *   return <div onScroll={handleScroll}>滚动内容</div>;
 * };
 */
export const useThrottled = (delayTime: number = 500) => {
    const lastCallRef = useRef<number>(0)

    const throttledFunction = (fn: () => void = () => {}) => {
        const now = Date.now()
        const timeSinceLastCall = now - lastCallRef.current

        if (timeSinceLastCall >= delayTime) {
            fn()
            lastCallRef.current = now
        }
    }

    return throttledFunction
}
