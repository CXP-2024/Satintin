import { StateStorage } from 'zustand/middleware'
import { aesDecrypt, aesEncrypt } from 'Plugins/CommonUtils/Encryption/AesCrypter'
import { del, get, set } from 'idb-keyval'
import { requireEncryption } from 'Plugins/CommonUtils/Encryption/EncryptionUtils'
import { FeishuHooksMessageBody } from 'Plugins/CommonUtils/Types/FeishuHooksMessage'
import { reportFeishuMessage } from 'Plugins/CommonUtils/Functions/TriggerFeishuHooks'

const aesLocalStorage: StateStorage = {
    getItem: (key: string) => {
        const item = localStorage.getItem(key)
        return item ? aesDecrypt(item) : null
    },
    setItem: (key: string, value: string) => {
        localStorage.setItem(key, aesEncrypt(value))
    },
    removeItem: (key: string) => {
        localStorage.removeItem(key)
    },
}

const aesSessionStorage: StateStorage = {
    getItem: (key: string) => {
        const item = sessionStorage.getItem(key)
        return item ? aesDecrypt(item) : null
    },
    setItem: (key: string, value: string) => {
        sessionStorage.setItem(key, aesEncrypt(value))
    },
    removeItem: (key: string) => {
        sessionStorage.removeItem(key)
    },
}

const aesIndexedDBStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name).then(value => (value ? aesDecrypt(value) : ''))) || null
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, aesEncrypt(value))
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name)
    },
}

export const indexedDBStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) || null
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value)
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name)
    },
}

export const encryptionLocalStorage: StateStorage = requireEncryption() ? aesLocalStorage : localStorage
export const encryptionSessionStorage: StateStorage = requireEncryption() ? aesSessionStorage : sessionStorage
export const encryptionIndexedDBStorage: StateStorage = requireEncryption() ? aesIndexedDBStorage : indexedDBStorage

if (!encryptionSessionStorage || !encryptionLocalStorage || !encryptionIndexedDBStorage) {
    reportFeishuMessage(new FeishuHooksMessageBody('text', { text: 'encryptionSessionStorage循环调用📌📌📌📌📌📌📌' }))
}
