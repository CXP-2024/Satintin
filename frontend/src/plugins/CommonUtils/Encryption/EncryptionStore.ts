import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { generateKeyPair } from './EncryptionUtils'

const encryptionStore = create(
    persist(() => generateKeyPair(), {
        name: 'encryptionStore',
        storage: createJSONStorage(() => sessionStorage),
    })
)

export function getPrivateKeySnap(): string {
    return encryptionStore.getState()?.clientPrivate
}

export function getPublicKeySnap(): string {
    return encryptionStore.getState()?.clientPublic
}
