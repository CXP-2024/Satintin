//获取Mac地址
import * as os from 'os'
import { exec } from 'child_process'

import create from 'zustand'
import { persist } from 'zustand/middleware'
import { encryptionLocalStorage } from 'Plugins/CommonUtils/Functions/DefaultStorage'

const macAddressIDStore = create(
    persist(
        () => ({
            macAddressID: '',
        }),
        {
            name: 'macAddressIDStore',
            getStorage: () => encryptionLocalStorage,
        }
    )
)
export function getMacAddressIDSnap(): string {
    return macAddressIDStore.getState().macAddressID
}

export function setMacAddressID(macAddressID: string) {
    macAddressIDStore.setState({ macAddressID })
}

export function getMacAddress(): Promise<string> {
    return new Promise((resolve, reject) => {
        const platform = os.platform()

        if (platform === 'darwin' || platform === 'linux') {
            const networkInterfaces = os.networkInterfaces()

            // 遍历所有网络接口
            for (const interfaceName in networkInterfaces) {
                const networkInterface = networkInterfaces[interfaceName]
                if (networkInterface && networkInterface.length > 0) {
                    const mac = networkInterface[0].mac
                    // 确保MAC地址不是全0
                    if (mac && mac !== '00:00:00:00:00:00') {
                        return resolve(mac)
                    }
                }
            }
            // 如果找不到有效的MAC地址
            reject(new Error('MAC address not found'))
        } else if (platform === 'win32') {
            exec('getmac', (err: Error, stdout: string) => {
                if (err) {
                    reject(err)
                } else {
                    const matches = stdout.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/g)
                    if (matches && matches.length > 0) {
                        resolve(matches[0])
                    } else {
                        reject(new Error('MAC address not found'))
                    }
                }
            })
        } else {
            reject(new Error('Unsupported platform'))
        }
    })
}

export async function getMacAddressFunc() {
    try {
        const macAddress = await getMacAddress()
        setMacAddressID(macAddress)
        return `${macAddress}`
    } catch (error) {
        console.log(`Error: ${error.message}`)
        return `${error.message}`
    }
}
