export function deepCopy<T>(obj: T, cache: WeakMap<Record<string, unknown>, any> = new WeakMap()) {
    if (typeof obj !== 'object' || obj === null) {
        return obj
    }

    if (cache.has(obj as Record<string, unknown>)) {
        return cache.get(obj as Record<string, unknown>)
    }

    if (Array.isArray(obj)) {
        const result: any[] = []
        cache.set(obj as Record<string, unknown>, result)
        obj.forEach((item, index) => {
            result[index] = deepCopy(item, cache)
        })
        return result as any
    }

    if (typeof obj === 'object') {
        const result: Record<string, unknown> = {}
        cache.set(obj as Record<string, unknown>, result)
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = deepCopy((obj as Record<string, unknown>)[key], cache)
            }
        }
        return result as any
    }

    return obj
}

export function deepCopyMap<T, V>(map: Map<T, V>): Map<T, V> {
    const result = new Map<T, V>()
    map.forEach((value: V, key: T) => result.set(key, deepCopy(value)))
    return result
}

export function replacer(key: any, value: any) {
    if (value instanceof Map) {
        const a = {} as any
        value.forEach((v, k) => (a[k] = v))
        return a
    } else {
        return value
    }
}
export function replacePassword(key: any, value: any) {
    if (value instanceof Map) {
        const a = {} as any
        value.forEach((v, k) => (a[k] = v))
        return a
    }
    if (key === 'serializedInfo') {
        const b = JSON.parse(value) as any
        if ('password' in b) {
            b.password = ''
            return JSON.stringify(b)
        }
        return value
    } else {
        return value
    }
}

/* 复制 */
export function commonDeepClone(target: any, hash = new WeakMap()) {
    if (target === null) return target
    if (target instanceof Date) return new Date(target)
    if (target instanceof HTMLElement) return target
    if (typeof target !== 'object') return target

    if (hash.get(target)) return hash.get(target)
    const cloneTarget = new target.constructor()
    hash.set(target, cloneTarget)

    if (target instanceof Map) {
        target.forEach((value, key) => {
            cloneTarget.set(key, commonDeepClone(value, hash))
        })
        return cloneTarget
    }
    if (target instanceof Set) {
        target.forEach(value => {
            cloneTarget.add(commonDeepClone(value, hash))
        })
    }

    Reflect.ownKeys(target).forEach(key => {
        cloneTarget[key] = commonDeepClone(target[key], hash)
    })
    return cloneTarget
}
