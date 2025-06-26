import create from 'zustand'
import { randomString } from '@/plugins/CommonUtils/Functions/StringUtils'
import { persist } from 'zustand/middleware'
import { encryptionSessionStorage } from '@/plugins/CommonUtils/Functions/DefaultStorage'

const uniqueIDStore = create(
    persist(
        () => ({
            uniqueID: randomString(15),
        }),
        {
            name: 'uniqueIDStore',
            getStorage: () => encryptionSessionStorage,
        }
    )
)

export function getUniqueIDSnap(): string {
    return uniqueIDStore.getState().uniqueID
}
