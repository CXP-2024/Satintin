import { create } from 'zustand'
import { randomString } from './Functions/StringUtils'
import { persist } from 'zustand/middleware'

const uniqueIDStore = create(
    persist(
        () => ({
            uniqueID: randomString(15),
        }),
        {
            name: 'uniqueIDStore',
        }
    )
)

export function getUniqueIDSnap(): string {
    return uniqueIDStore.getState().uniqueID
}
