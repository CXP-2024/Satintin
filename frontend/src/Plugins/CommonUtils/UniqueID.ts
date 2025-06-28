import create from 'zustand'
import { randomString } from 'Plugins/CommonUtils/Functions/StringUtils'
import { persist } from 'zustand/middleware'
import { encryptionSessionStorage } from 'Plugins/CommonUtils/Functions/DefaultStorage'

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
