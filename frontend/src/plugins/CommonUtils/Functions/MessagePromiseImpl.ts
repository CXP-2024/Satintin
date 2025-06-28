import { API, SimpleCallBackType } from 'Plugins/CommonUtils/Send/API'

/**
 * 把请求包裹在Promise里面
 * 使用这个方法, 避免回调地狱
 * @example 
 * ```
 * // 回调地狱的写法
 * API1.send(
 *   (info1) => {
 *     // 处理第一层返回
 *     API2.send(
 *       (info2) => {
 *         // 处理第二层返回
 *         API3.send(
 *           (info3) => {
 *             // 处理第三层返回
 *             API4.send(
 *               (info4) => {
 *                 // 最终处理
 *               },
 *               (err) => console.error(err)
 *             )
 *           },
 *           (err) => console.error(err)
 *         )
 *       },
 *       (err) => console.error(err)
 *     )
 *   },
 *   (err) => console.error(err)
 * )
 * 
 * // 使用 messagePromiseImpl 的写法
 * try {
 *   const result1 = await messagePromiseImpl<Result1>(API1);
 *   const result2 = await messagePromiseImpl<Result2>(API2);
 *   const result3 = await messagePromiseImpl<Result3>(API3);
 *   const result4 = await messagePromiseImpl<Result4>(API4);
 *   // 处理结果
 * } catch (err) {
 *   console.error(err);
 * }
 * ```
 * @param MessageInstant
 * @param backdropCall
 * @param timeout
 * @param timeoutCall
 */
export const messagePromiseImpl = <T>(
    MessageInstant: API,
    backdropCall: SimpleCallBackType | null = null,
    timeout: number = 1000 * 50,
    timeoutCall: SimpleCallBackType | null = null
) =>
    new Promise<T>((resolve, reject) => {
        MessageInstant.send(
            info => {
                try {
                    resolve(JSON.parse(info) as T)
                } catch (_) {
                    // T是string类型的时候
                    resolve(info as T)
                }
            },
            err => {
                reject(err)
            },
            backdropCall,
            timeout,
            timeoutCall
        )
    })
